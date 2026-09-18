"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { AcessoEvento, AtracaoEvento, TipoEvento } from "@/types/evento";
import { ACESSO_PADRAO, HORA_PADRAO, REDIRECT_SUCESSO_MS } from "../constants";
import { montarIsoEncerramento, montarIsoEvento } from "../montar-iso-evento";
import { eventosService } from "../services/eventos.service";
import type { ErrosCriarEvento } from "../types";
import { useCampoLocalEvento } from "./useCampoLocalEvento";
import { useFotoFlyer } from "./useFotoFlyer";
import { validarCriarEvento } from "./validar-criar-evento";

export const useFormularioCriarEvento = () => {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const foto = useFotoFlyer();
  const local = useCampoLocalEvento();

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoEvento | null>(null);
  const [dataEvento, setDataEvento] = useState("");
  const [horaAbertura, setHoraAbertura] = useState(HORA_PADRAO);
  const [horaEncerramento, setHoraEncerramento] = useState("");
  const [acesso, setAcesso] = useState<AcessoEvento>(ACESSO_PADRAO);
  const [linkIngresso, setLinkIngresso] = useState("");
  const [atracoes, setAtracoes] = useState<AtracaoEvento[]>([]);
  const [informacoes, setInformacoes] = useState("");
  const [erros, setErros] = useState<ErrosCriarEvento>({});
  const [publicando, setPublicando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const redirectRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectRef.current) window.clearTimeout(redirectRef.current);
    };
  }, []);

  const alternarAtracao = (valor: AtracaoEvento) => {
    setAtracoes((atuais) =>
      atuais.includes(valor)
        ? atuais.filter((item) => item !== valor)
        : [...atuais, valor]
    );
  };

  const publicar = async (e: FormEvent) => {
    e.preventDefault();
    setSucesso(false);
    setErroGeral(null);
    const errosAtuais = validarCriarEvento({
      titulo,
      tipo,
      local: local.valor,
      dataEvento,
      horaAbertura,
      horaEncerramento,
      acesso,
      linkIngresso,
      photoFile: foto.arquivo,
      informacoes,
    });
    setErros(errosAtuais);
    if (Object.keys(errosAtuais).length > 0) return;
    if (!firebaseUser || !tipo) return;

    setPublicando(true);
    try {
      const fotoCapaUrl = await foto.enviar(firebaseUser.uid);
      await eventosService.criar({
        titulo: titulo.trim(),
        tipo,
        local: {
          lat: local.valor.lat as number,
          lng: local.valor.lng as number,
          endereco: local.valor.endereco.trim(),
          nome: local.valor.nome.trim(),
        },
        dataHoraAbertura: montarIsoEvento(dataEvento, horaAbertura),
        dataHoraEncerramento: horaEncerramento.trim()
          ? montarIsoEncerramento(dataEvento, horaAbertura, horaEncerramento)
          : null,
        acesso,
        linkIngresso:
          acesso === "ingresso" ? linkIngresso.trim() : null,
        atracoes,
        fotoCapaUrl,
        informacoes: informacoes.trim(),
      });
      setSucesso(true);
      redirectRef.current = window.setTimeout(() => {
        router.push("/");
      }, REDIRECT_SUCESSO_MS);
    } catch (erro) {
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
    dataEvento,
    setDataEvento,
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
    erros,
    publicando,
    sucesso,
    erroGeral,
    publicar,
  };
};
