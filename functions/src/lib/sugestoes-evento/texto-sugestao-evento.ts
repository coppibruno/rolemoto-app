import type {AcessoEvento} from "../../types/evento";

const LIMITE_INFORMACOES = 2000;
const LIMITE_TITULO = 80;

export const tituloCurto = (titulo: string): string => {
  const limpo = titulo.replace(/\s+/g, " ").trim();
  if (limpo.length <= LIMITE_TITULO) {
    return limpo;
  }
  return `${limpo.slice(0, LIMITE_TITULO - 3).trimEnd()}...`;
};

export const montarInformacoes = (descricao: string, url: string): string => {
  const base = descricao.replace(/\s+/g, " ").trim();
  const linha = `Agenda: ${url}`;
  if (!base) {
    return linha.slice(0, LIMITE_INFORMACOES);
  }
  const junto = `${base}\n\n${linha}`;
  if (junto.length <= LIMITE_INFORMACOES) {
    return junto;
  }
  const corte = Math.max(0, LIMITE_INFORMACOES - linha.length - 2);
  return `${base.slice(0, corte).trim()}\n\n${linha}`;
};

const normalizar = (valor: string): string =>
  valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

/** Preço no texto vira ingresso. "Gratuito" sem valor fica grátis. */
export const acessoDaAgenda = (
  texto: string,
  url: string,
): {acesso: AcessoEvento; linkIngresso: string | null} => {
  const temPreco = /r\$\s*\d/i.test(texto);
  if (/\bgratuit/.test(normalizar(texto)) && !temPreco) {
    return {acesso: "gratis", linkIngresso: null};
  }
  if (temPreco || /\bingresso\b/.test(normalizar(texto))) {
    return {acesso: "ingresso", linkIngresso: url};
  }
  return {acesso: "gratis", linkIngresso: null};
};
