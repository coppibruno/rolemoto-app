"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { RitmoRole, RoleModelo } from "@/types/role";
import {
  DESCRICAO_MAX,
  ENDERECO_MIN,
  HORA_PADRAO,
  REDIRECT_SUCESSO_MS,
  RITMO_PADRAO,
  TITULO_MAX,
  TITULO_MIN,
} from "../constants";
import { montarIsoSaida } from "../montar-iso-saida";
import { rolesService } from "../services/roles.service";
import type { ErrosCriarRole, LocalizacaoForm } from "../types";
import { pedirPermissaoERegistrar } from "../../hooks/useRegistroFcm";
import { useCampoLocalizacao } from "./useCampoLocalizacao";
import { useFotoCapa } from "./useFotoCapa";

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const HORA_RE = /^\d{2}:\d{2}$/;
const RITMOS: RitmoRole[] = ["tranquila", "moderada", "agressiva"];

const dataCalendarioValida = (ymd: string): boolean => {
  if (!DATA_RE.test(ymd)) return false;
  const [ano, mes, dia] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    dt.getUTCFullYear() === ano &&
    dt.getUTCMonth() === mes - 1 &&
    dt.getUTCDate() === dia
  );
};

const coordsValidas = (campo: LocalizacaoForm): boolean =>
  typeof campo.lat === "number" &&
  Number.isFinite(campo.lat) &&
  typeof campo.lng === "number" &&
  Number.isFinite(campo.lng);

const validar = (campos: {
  titulo: string;
  partida: LocalizacaoForm;
  destino: LocalizacaoForm;
  dataSaida: string;
  horaSaida: string;
  ritmo: RitmoRole;
  photoFile: File | null;
  capaHerdada: boolean;
  descricao: string;
}): ErrosCriarRole => {
  const erros: ErrosCriarRole = {};
  const titulo = campos.titulo.trim();

  if (!titulo) erros.titulo = "Informe o título do rolê";
  else if (titulo.length < TITULO_MIN) erros.titulo = "Mínimo 3 caracteres";
  else if (titulo.length > TITULO_MAX) erros.titulo = "Máximo 80 caracteres";

  if (campos.partida.endereco.trim().length < ENDERECO_MIN) {
    erros.partida = "Informe o ponto de partida";
  } else if (!coordsValidas(campos.partida)) {
    erros.partida = "Escolha um endereço da lista ou use o GPS";
  }

  if (campos.destino.endereco.trim().length < ENDERECO_MIN) {
    erros.destino = "Informe o destino";
  } else if (!coordsValidas(campos.destino)) {
    erros.destino = "Escolha um endereço da lista";
  }

  if (!campos.dataSaida.trim() || !dataCalendarioValida(campos.dataSaida)) {
    erros.dataHora = "Informe a data de partida";
  } else if (!HORA_RE.test(campos.horaSaida)) {
    erros.dataHora = "Informe o horário de partida";
  } else {
    const iso = montarIsoSaida(campos.dataSaida, campos.horaSaida);
    if (Number.isNaN(Date.parse(iso)) || Date.parse(iso) <= Date.now()) {
      erros.dataHora = "A partida precisa ser no futuro";
    }
  }

  if (!RITMOS.includes(campos.ritmo)) {
    erros.ritmo = "Selecione o ritmo da tocada";
  }

  if (!campos.photoFile && !campos.capaHerdada) {
    erros.foto = "Inclua a foto de capa do rolê";
  }

  if (campos.descricao.trim().length > DESCRICAO_MAX) {
    erros.descricao = "Máximo 2000 caracteres";
  }

  return erros;
};

export const useFormularioCriarRole = (modelo: RoleModelo | null) => {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const foto = useFotoCapa();
  const partida = useCampoLocalizacao();
  const destino = useCampoLocalizacao();

  const [titulo, setTitulo] = useState("");
  const [dataSaida, setDataSaida] = useState("");
  const [horaSaida, setHoraSaida] = useState(HORA_PADRAO);
  const [ritmo, setRitmo] = useState<RitmoRole>(RITMO_PADRAO);
  const [descricao, setDescricao] = useState("");
  const [erros, setErros] = useState<ErrosCriarRole>({});
  const [publicando, setPublicando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [origemHidratada, setOrigemHidratada] = useState<string | null>(null);
  const redirectRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectRef.current) window.clearTimeout(redirectRef.current);
    };
  }, []);

  useEffect(() => {
    if (!modelo) {
      setOrigemHidratada(null);
      return;
    }
    setTitulo(modelo.titulo);
    setDescricao(modelo.descricao);
    setRitmo(modelo.ritmo);
    setHoraSaida(HORA_RE.test(modelo.horaSaida) ? modelo.horaSaida : HORA_PADRAO);
    setDataSaida("");
    partida.preencher(modelo.localSaida);
    destino.preencher(modelo.destinoFinal);
    foto.usarUrlExistente(modelo.fotoCapaUrl);
    setOrigemHidratada(modelo.roleIdOrigem);
  }, [modelo, partida.preencher, destino.preencher, foto.usarUrlExistente]);

  const publicar = async (e: FormEvent) => {
    e.preventDefault();
    setSucesso(false);
    setErroGeral(null);
    const errosAtuais = validar({
      titulo,
      partida: partida.valor,
      destino: destino.valor,
      dataSaida,
      horaSaida,
      ritmo,
      photoFile: foto.arquivo,
      capaHerdada: foto.urlHerdada,
      descricao,
    });
    setErros(errosAtuais);
    if (Object.keys(errosAtuais).length > 0) return;
    if (!firebaseUser) return;

    setPublicando(true);
    try {
      const fotoCapaUrl = await foto.enviar(firebaseUser.uid);
      await rolesService.criar({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        fotoCapaUrl,
        ritmo,
        dataHoraSaida: montarIsoSaida(dataSaida, horaSaida),
        localSaida: {
          lat: partida.valor.lat as number,
          lng: partida.valor.lng as number,
          endereco: partida.valor.endereco.trim(),
        },
        destinoFinal: {
          lat: destino.valor.lat as number,
          lng: destino.valor.lng as number,
          endereco: destino.valor.endereco.trim(),
        },
      });
      setSucesso(true);
      void pedirPermissaoERegistrar();
      redirectRef.current = window.setTimeout(() => {
        router.push("/");
      }, REDIRECT_SUCESSO_MS);
    } catch (erro) {
      const mensagem =
        erro instanceof ApiError
          ? erro.message
          : "Erro ao publicar o rolê. Tente novamente.";
      setErroGeral(mensagem);
      setPublicando(false);
    }
  };

  return {
    titulo,
    setTitulo,
    partida,
    destino,
    dataSaida,
    setDataSaida,
    horaSaida,
    setHoraSaida,
    ritmo,
    setRitmo,
    descricao,
    setDescricao,
    foto,
    erros,
    publicando,
    sucesso,
    erroGeral,
    hidratando: modelo != null && origemHidratada !== modelo.roleIdOrigem,
    publicar,
  };
};
