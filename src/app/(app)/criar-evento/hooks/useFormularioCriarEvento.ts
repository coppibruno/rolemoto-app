"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { AcessoEvento, AtracaoEvento, TipoEvento } from "@/types/evento";
import type { SerieEvento } from "@/types/serie-evento";
import { seriesEventoService } from "@/app/(app)/series-evento/services/series-evento.service";
import { ACESSO_PADRAO, HORA_PADRAO, REDIRECT_SUCESSO_MS } from "../constants";
import { montarIsoEncerramento, montarIsoEvento } from "../montar-iso-evento";
import { eventosService } from "../services/eventos.service";
import type { ErrosCriarEvento } from "../types";
import { useCampoLocalEvento } from "./useCampoLocalEvento";
import { useFotoFlyer } from "./useFotoFlyer";
import { validarCriarEvento } from "./validar-criar-evento";

const tipoDoForm = (tipo: SerieEvento["tipo"] | undefined): TipoEvento | null => {
  if (
    tipo === "moto_point" ||
    tipo === "track_day" ||
    tipo === "cafe_pilotos" ||
    tipo === "exposicao_custom"
  ) {
    return tipo;
  }
  return tipo ? "moto_point" : null;
};

export const useFormularioCriarEvento = (serieInicial?: SerieEvento) => {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const editando = Boolean(serieInicial);
  const foto = useFotoFlyer(serieInicial?.fotoCapaUrl ?? "");
  const local = useCampoLocalEvento(
    serieInicial
      ? {
          endereco: serieInicial.local.endereco,
          lat: serieInicial.local.lat,
          lng: serieInicial.local.lng,
          nome: serieInicial.local.nome,
        }
      : undefined,
  );

  const [titulo, setTitulo] = useState(serieInicial?.titulo ?? "");
  const [tipo, setTipo] = useState<TipoEvento | null>(tipoDoForm(serieInicial?.tipo));
  const [todaSemana, setTodaSemana] = useState(editando);
  const [diaSemana, setDiaSemana] = useState<number | null>(serieInicial?.diaSemana ?? null);
  const [aPartirDe, setAPartirDe] = useState(serieInicial?.aPartirDe ?? "");
  const [dataEvento, setDataEvento] = useState("");
  const [horaAbertura, setHoraAbertura] = useState(serieInicial?.horaAbertura ?? HORA_PADRAO);
  const [dataEncerramento, setDataEncerramento] = useState("");
  const [horaEncerramento, setHoraEncerramento] = useState(
    serieInicial?.horaEncerramento ?? "",
  );
  const [acesso, setAcesso] = useState<AcessoEvento>(serieInicial?.acesso ?? ACESSO_PADRAO);
  const [linkIngresso, setLinkIngresso] = useState(serieInicial?.linkIngresso ?? "");
  const [atracoes, setAtracoes] = useState<AtracaoEvento[]>(serieInicial?.atracoes ?? []);
  const [informacoes, setInformacoes] = useState(serieInicial?.informacoes ?? "");
  const [pontoOficialId, setPontoOficialId] = useState<string | null>(
    serieInicial?.localId ?? null,
  );
  const [erros, setErros] = useState<ErrosCriarEvento>({});
  const [publicando, setPublicando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const redirectRef = useRef<number | null>(null);

  const aoMudarDataInicio = (valor: string) => {
    setDataEvento(valor);
    setDataEncerramento((atual) => {
      if (!atual || atual < valor) return valor;
      return atual;
    });
  };

  useEffect(() => {
    return () => {
      if (redirectRef.current) window.clearTimeout(redirectRef.current);
    };
  }, []);

  const alternarAtracao = (valor: AtracaoEvento) => {
    setAtracoes((atuais) =>
      atuais.includes(valor)
        ? atuais.filter((item) => item !== valor)
        : [...atuais, valor],
    );
  };

  const publicar = async (e: FormEvent) => {
    e.preventDefault();
    if (publicando) return;
    setSucesso(false);
    setErroGeral(null);
    setPublicando(true);

    try {
      const localResolvido = await local.resolverPontoPendente();
      const errosAtuais = validarCriarEvento({
        titulo,
        tipo,
        local: localResolvido,
        dataEvento,
        horaAbertura,
        dataEncerramento,
        horaEncerramento,
        acesso,
        linkIngresso,
        photoFile: foto.arquivo,
        informacoes,
        fotoJaExiste: Boolean(foto.previewUrl),
        semanal: todaSemana
          ? { ativo: true, diaSemana, aPartirDe }
          : undefined,
      });
      setErros(errosAtuais);
      if (Object.keys(errosAtuais).length > 0) {
        setPublicando(false);
        window.requestAnimationFrame(() => {
          document
            .querySelector<HTMLElement>("[role='alert']")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        return;
      }
      if (!firebaseUser || !tipo || (todaSemana && diaSemana === null)) {
        setErroGeral("Sessão expirada. Entre de novo para publicar.");
        setPublicando(false);
        return;
      }

      const fotoCapaUrl = await foto.enviar(firebaseUser.uid, serieInicial?.fotoCapaUrl ?? "");
      const localPayload = {
        lat: localResolvido.lat as number,
        lng: localResolvido.lng as number,
        endereco: localResolvido.endereco.trim(),
        nome: localResolvido.nome.trim(),
      };

      if (todaSemana && diaSemana !== null) {
        const payload = {
          titulo: titulo.trim(),
          tipo,
          local: localPayload,
          localId: pontoOficialId,
          diaSemana,
          horaAbertura,
          horaEncerramento: horaEncerramento.trim(),
          aPartirDe: aPartirDe.trim() || null,
          acesso,
          linkIngresso: acesso === "ingresso" ? linkIngresso.trim() : null,
          atracoes,
          fotoCapaUrl,
          informacoes: informacoes.trim(),
        };
        if (serieInicial) {
          await seriesEventoService.atualizar(serieInicial.id, payload);
          router.push(`/series-evento/${serieInicial.id}`);
        } else {
          const criada = await seriesEventoService.criar(payload);
          router.push(`/series-evento/${criada.serie.id}`);
        }
        return;
      }

      await eventosService.criar({
        titulo: titulo.trim(),
        tipo,
        local: localPayload,
        dataHoraAbertura: montarIsoEvento(dataEvento, horaAbertura),
        dataHoraEncerramento: horaEncerramento.trim()
          ? montarIsoEncerramento(
              dataEncerramento.trim() || dataEvento,
              horaEncerramento,
            )
          : null,
        acesso,
        linkIngresso: acesso === "ingresso" ? linkIngresso.trim() : null,
        atracoes,
        fotoCapaUrl,
        informacoes: informacoes.trim(),
        localId: pontoOficialId,
      });
      setSucesso(true);
      redirectRef.current = window.setTimeout(() => {
        router.push("/");
      }, REDIRECT_SUCESSO_MS);
    } catch (erro) {
      console.error(erro);
      const mensagem =
        erro instanceof ApiError
          ? erro.message
          : "Erro ao publicar o evento. Tente novamente.";
      setErroGeral(mensagem);
      setPublicando(false);
    }
  };

  return {
    titulo,
    setTitulo,
    tipo,
    setTipo,
    local,
    todaSemana,
    setTodaSemana,
    diaSemana,
    setDiaSemana,
    aPartirDe,
    setAPartirDe,
    editando,
    dataEvento,
    setDataEvento: aoMudarDataInicio,
    dataEncerramento,
    setDataEncerramento,
    horaAbertura,
    setHoraAbertura,
    horaEncerramento,
    setHoraEncerramento,
    acesso,
    setAcesso,
    linkIngresso,
    setLinkIngresso,
    atracoes,
    alternarAtracao,
    informacoes,
    setInformacoes,
    foto,
    pontoOficialId,
    setPontoOficialId,
    erros,
    publicando,
    sucesso,
    erroGeral,
    publicar,
  };
};
