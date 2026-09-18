import type { AcessoEvento, TipoEvento } from "@/types/evento";
import {
  ENDERECO_MIN,
  INFORMACOES_MAX,
  LINK_INGRESSO_MAX,
  TITULO_MAX,
  TITULO_MIN,
} from "../constants";
import { montarIsoEncerramento, montarIsoEvento } from "../montar-iso-evento";
import type { ErrosCriarEvento, LocalizacaoForm } from "../types";

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const HORA_RE = /^\d{2}:\d{2}$/;
const TIPOS: TipoEvento[] = [
  "moto_point_semanal",
  "track_day",
  "cafe_pilotos",
  "exposicao_custom",
];
const ACESSOS: AcessoEvento[] = ["gratis", "ingresso"];

const urlIngressoValida = (valor: string): boolean => {
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

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

export const validarCriarEvento = (campos: {
  titulo: string;
  tipo: TipoEvento | null;
  local: LocalizacaoForm;
  dataEvento: string;
  horaAbertura: string;
  horaEncerramento: string;
  acesso: AcessoEvento;
  linkIngresso: string;
  photoFile: File | null;
  informacoes: string;
}): ErrosCriarEvento => {
  const erros: ErrosCriarEvento = {};
  const titulo = campos.titulo.trim();

  if (!titulo) erros.titulo = "Informe o nome do evento";
  else if (titulo.length < TITULO_MIN) erros.titulo = "Mínimo 3 caracteres";
  else if (titulo.length > TITULO_MAX) erros.titulo = "Máximo 80 caracteres";

  if (!campos.tipo || !TIPOS.includes(campos.tipo)) {
    erros.tipo = "Selecione o tipo de evento";
  }

  if (campos.local.endereco.trim().length < ENDERECO_MIN) {
    erros.local = "Informe o local do evento";
  } else if (!coordsValidas(campos.local)) {
    erros.local = "Escolha um endereço da lista ou use o GPS";
  }

  let aberturaIso = "";
  if (!campos.dataEvento.trim() || !dataCalendarioValida(campos.dataEvento)) {
    erros.dataEvento = "Informe a data do evento";
  } else if (!HORA_RE.test(campos.horaAbertura)) {
    erros.horaAbertura = "Informe o horário de abertura";
  } else {
    aberturaIso = montarIsoEvento(campos.dataEvento, campos.horaAbertura);
    if (Number.isNaN(Date.parse(aberturaIso)) || Date.parse(aberturaIso) <= Date.now()) {
      erros.horaAbertura = "A abertura precisa ser no futuro";
    }
  }

  const horaFim = campos.horaEncerramento.trim();
  if (horaFim) {
    if (!HORA_RE.test(horaFim) || horaFim === campos.horaAbertura) {
      erros.horaEncerramento = "O encerramento precisa ser depois da abertura";
    } else if (aberturaIso) {
      const isoFim = montarIsoEncerramento(
        campos.dataEvento,
        campos.horaAbertura,
        horaFim
      );
      if (Date.parse(isoFim) <= Date.parse(aberturaIso)) {
        erros.horaEncerramento = "O encerramento precisa ser depois da abertura";
      }
    }
  }

  if (!ACESSOS.includes(campos.acesso)) {
    erros.acesso = "Selecione a modalidade de acesso";
  } else if (campos.acesso === "ingresso") {
    const link = campos.linkIngresso.trim();
    if (!link) erros.linkIngresso = "Informe o link da compra do ingresso";
    else if (link.length > LINK_INGRESSO_MAX) {
      erros.linkIngresso = `Máximo ${LINK_INGRESSO_MAX} caracteres`;
    } else if (!urlIngressoValida(link)) {
      erros.linkIngresso = "Informe um link válido (http ou https)";
    }
  }

  if (!campos.photoFile) {
    erros.foto = "Inclua o flyer ou a foto de capa";
  }

  if (campos.informacoes.trim().length > INFORMACOES_MAX) {
    erros.informacoes = "Máximo 2000 caracteres";
  }

  return erros;
};
