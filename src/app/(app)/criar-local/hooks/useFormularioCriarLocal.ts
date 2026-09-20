"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { urlAbrirMaps } from "@/lib/maps";
import type {
  CategoriaLocal,
  FacilidadeLocal,
  HorarioDiaForm,
  HorarioDiaLocal,
} from "@/types/local";
import { locaisService } from "../../locais/services/locais.service";
import { LINK_MAPS_MAX, NOME_MAX, REDIRECT_SUCESSO_MS } from "../constants";
import { horariosPadraoEspecifico } from "../horarios-padrao";
import { useCampoEnderecoLocal } from "./useCampoEnderecoLocal";
import { useFotoFachada } from "./useFotoFachada";
import { validarCriarLocal } from "./validar-criar-local";

const montarHorarios = (dias: HorarioDiaForm[]): HorarioDiaLocal[] =>
  [...dias]
    .sort((a, b) => a.dia - b.dia)
    .map((dia) => ({
      dia: dia.dia,
      fechado: dia.fechado,
      abertura: dia.fechado ? null : dia.abertura,
      fechamento: dia.fechado ? null : dia.fechamento,
    }));

export const useFormularioCriarLocal = () => {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const endereco = useCampoEnderecoLocal();
  const foto = useFotoFachada();

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaLocal | null>(null);
  const [facilidades, setFacilidades] = useState<FacilidadeLocal[]>([]);
  const [aberto24h, setAberto24h] = useState(true);
  const [horarios, setHorarios] = useState<HorarioDiaForm[]>(horariosPadraoEspecifico);
  const [erros, setErros] = useState<ReturnType<typeof validarCriarLocal>>({});
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const redirectRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectRef.current) window.clearTimeout(redirectRef.current);
    };
  }, []);

  const alternarFacilidade = (item: FacilidadeLocal) => {
    setFacilidades((atual) =>
      atual.includes(item) ? atual.filter((v) => v !== item) : [...atual, item],
    );
  };

  const atualizarHorario = (dia: HorarioDiaForm["dia"], patch: Partial<HorarioDiaForm>) => {
    setHorarios((atual) =>
      atual.map((item) => (item.dia === dia ? { ...item, ...patch } : item)),
    );
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    setSucesso(false);
    setErroGeral(null);
    setSalvando(true);

    try {
      const ponto = await endereco.resolverPontoPendente();
      const errosAtuais = validarCriarLocal({
        nome,
        endereco: ponto.endereco,
        lat: ponto.lat,
        lng: ponto.lng,
        categoria,
        aberto24h,
        horarios,
        fotoErro: foto.erro,
      });
      setErros(errosAtuais);
      if (Object.keys(errosAtuais).length > 0) {
        setSalvando(false);
        window.requestAnimationFrame(() => {
          document
            .querySelector<HTMLElement>("[role='alert']")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        return;
      }
      if (!firebaseUser || !categoria || ponto.lat == null || ponto.lng == null) {
        setErroGeral("Sessão expirada. Entre de novo para salvar.");
        setSalvando(false);
        return;
      }

      const fotoFachadaUrl = foto.arquivo
        ? await foto.enviar(firebaseUser.uid)
        : "";

      const linkMaps = urlAbrirMaps({
        lat: ponto.lat,
        lng: ponto.lng,
        endereco: ponto.endereco.trim(),
        nome: nome.trim(),
      }).slice(0, LINK_MAPS_MAX);

      await locaisService.criar({
        nome: nome.trim().slice(0, NOME_MAX),
        endereco: ponto.endereco.trim(),
        lat: ponto.lat,
        lng: ponto.lng,
        categoria,
        facilidades,
        aberto24h,
        horarios: aberto24h ? [] : montarHorarios(horarios),
        linkMaps,
        fotoFachadaUrl,
      });

      setSucesso(true);
      redirectRef.current = window.setTimeout(() => {
        router.push("/locais");
      }, REDIRECT_SUCESSO_MS);
    } catch (erro) {
      const mensagem =
        erro instanceof ApiError
          ? erro.message
          : "Erro ao salvar o local. Tente novamente.";
      setErroGeral(mensagem);
      setSalvando(false);
    }
  };

  return {
    nome,
    setNome,
    endereco,
    categoria,
    setCategoria,
    facilidades,
    alternarFacilidade,
    aberto24h,
    setAberto24h,
    horarios,
    atualizarHorario,
    foto,
    erros,
    salvando,
    sucesso,
    erroGeral,
    salvar,
  };
};
