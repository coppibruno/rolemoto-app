import type {CamposBusca, CamposBuscaLidos} from "../types/seguir";

const LIMITE_TEXTO = 40;

const MARCAS = /[\u0300-\u036f]/g;

/** trim, um espaço, minúsculas, sem acento, no máximo 40 caracteres. */
export const normalizarBusca = (valor: string): string => {
  const colapsado = valor.trim().replace(/\s+/g, " ").toLowerCase();
  const semMarca = colapsado.normalize("NFD").replace(MARCAS, "");
  return semMarca.slice(0, LIMITE_TEXTO);
};

/** A rota recusa termo com tamanho < 2 depois da normalização. */
export const termoBusca = (valor: string): string | null => {
  const termo = normalizarBusca(valor);
  if (termo.length < 2) {
    return null;
  }
  return termo;
};

export const camposBusca = (nome: string, apelido: string): CamposBusca => {
  const nomeBusca = normalizarBusca(nome);
  const apelidoBusca = apelido.trim() ? normalizarBusca(apelido) : "";
  const tokens = nomeBusca.split(" ").filter(Boolean);
  const primeiroNomeBusca = tokens[0] ?? "";
  const ultimoNomeBusca = tokens.length > 1 ?
    tokens[tokens.length - 1] ?? primeiroNomeBusca :
    primeiroNomeBusca;
  return {
    nomeBusca,
    apelidoBusca,
    primeiroNomeBusca,
    ultimoNomeBusca,
  };
};

export const camposBuscaIguais = (
  lidos: CamposBuscaLidos,
  campos: CamposBusca,
): boolean =>
  lidos.nomeBusca === campos.nomeBusca &&
  lidos.apelidoBusca === campos.apelidoBusca &&
  lidos.primeiroNomeBusca === campos.primeiroNomeBusca &&
  lidos.ultimoNomeBusca === campos.ultimoNomeBusca;

const casaPrefixo = (campo: string, termo: string): boolean =>
  termo.length > 0 && campo.startsWith(termo);

const prioridade = (pessoa: CamposBusca, termo: string): number => {
  if (casaPrefixo(pessoa.apelidoBusca, termo)) {
    return 0;
  }
  if (casaPrefixo(pessoa.primeiroNomeBusca, termo)) {
    return 1;
  }
  if (casaPrefixo(pessoa.ultimoNomeBusca, termo)) {
    return 2;
  }
  if (casaPrefixo(pessoa.nomeBusca, termo)) {
    return 3;
  }
  return 4;
};

/** Ordena quem já passou no prefixo. Não consulta o banco. */
export const ordenarBusca = <T extends CamposBusca>(
  termoBruto: string,
  pessoas: readonly T[],
): T[] => {
  const termo = normalizarBusca(termoBruto);
  return [...pessoas].sort((a, b) => {
    const diff = prioridade(a, termo) - prioridade(b, termo);
    if (diff !== 0) {
      return diff;
    }
    if (a.nomeBusca < b.nomeBusca) {
      return -1;
    }
    if (a.nomeBusca > b.nomeBusca) {
      return 1;
    }
    return 0;
  });
};
