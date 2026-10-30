import type {TipoEvento} from "../../types/evento";

export const NOTA_MINIMA = 50;

const UFS = new Set(["SC", "PR", "RS"]);

const TIPOS_LISTA = new Set(["ENCONTRO", "FESTIVAL", "ANIVERSARIO"]);

const TERMOS_TITULO = [
  "motoclube",
  "moto clube",
  "motofest",
  "motocicl",
  "motorock",
  "motociata",
  "track day",
  "harley",
  "duas rodas",
  "moto",
] as const;

const TERMOS_TEXTO = [
  "motociclista",
  "expositor",
  "camping",
  "comboio",
  "estrada",
] as const;

export type EntradaPontuacaoEvento = {
  titulo: string;
  texto: string;
  tipoLista: string;
  uf: string;
};

export type PontuacaoEventoAceita = {
  entra: true;
  nota: number;
  motivos: string[];
  tipoSugerido: TipoEvento;
};

export type PontuacaoEventoRecusada = {entra: false};

const normalizar = (valor: string): string =>
  valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

const escapar = (valor: string): string =>
  valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const contemTermo = (texto: string, termo: string): boolean => {
  const base = normalizar(texto);
  const alvo = normalizar(termo);
  if (!alvo) {
    return false;
  }
  const re = new RegExp(`(^|[^a-z0-9])${escapar(alvo)}`);
  return re.test(base);
};

const termoForte = (texto: string): string | null => {
  for (const termo of TERMOS_TITULO) {
    if (contemTermo(texto, termo)) {
      return termo;
    }
  }
  if (/(^|[^a-z0-9])mc([^a-z0-9]|$)/.test(normalizar(texto))) {
    return "mc";
  }
  return null;
};

const termoTexto = (texto: string): string | null => {
  for (const termo of TERMOS_TEXTO) {
    if (contemTermo(texto, termo)) {
      return termo;
    }
  }
  return null;
};

const tipoLista = (valor: string): string =>
  normalizar(valor).toUpperCase().normalize("NFD").replace(/\p{M}/gu, "");

export const sugerirTipoEvento = (
  titulo: string,
  texto: string,
  lista: string,
): TipoEvento => {
  const junto = `${titulo} ${texto}`;
  if (contemTermo(junto, "track day") || contemTermo(titulo, "autodromo")) {
    return "track_day";
  }
  if (contemTermo(titulo, "cafe")) {
    return "cafe_pilotos";
  }
  if (
    lista === "FESTIVAL" ||
    contemTermo(titulo, "exposicao") ||
    contemTermo(titulo, "custom") ||
    contemTermo(titulo, "festival") ||
    contemTermo(titulo, "motofest")
  ) {
    return "exposicao_custom";
  }
  return "moto_point";
};

const showDeBar = (titulo: string): boolean =>
  contemTermo(titulo, "tributo") || contemTermo(titulo, "rock bar");

export const pontuarSugestaoEvento = (
  entrada: EntradaPontuacaoEvento,
): PontuacaoEventoAceita | PontuacaoEventoRecusada => {
  const lista = tipoLista(entrada.tipoLista);
  if (!UFS.has(entrada.uf) || !TIPOS_LISTA.has(lista)) {
    return {entra: false};
  }
  const noTitulo = termoForte(entrada.titulo);
  const noTexto = noTitulo ? null : termoForte(entrada.texto);
  const forte = noTitulo ?? noTexto;
  if (!forte || showDeBar(entrada.titulo)) {
    return {entra: false};
  }

  let nota = 50;
  const motivos = [noTitulo ? `título tem ${forte}` : `texto tem ${forte}`];
  if (lista === "ENCONTRO" || lista === "FESTIVAL") {
    nota += 15;
  }
  const citacao = termoTexto(entrada.texto);
  if (citacao && motivos.length < 3) {
    nota += 15;
    motivos.push(`texto cita ${citacao}`);
  }
  if (motivos.length < 3 && entrada.uf) {
    motivos.push(`no ${entrada.uf}`);
  }
  if (nota < NOTA_MINIMA) {
    return {entra: false};
  }
  return {
    entra: true,
    nota,
    motivos: motivos.slice(0, 3),
    tipoSugerido: sugerirTipoEvento(entrada.titulo, entrada.texto, lista),
  };
};
