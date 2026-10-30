export const normalizarNome = (valor: string): string =>
  valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const PREFIXO_ROTA = /^(serra|estrada|rota|canyon|morro) (do|da|de|dos|das) /;
const PREFIXO_MIRANTE = /^(mirante|belvedere|observatorio)s?( |$)/;
const PREFIXO_ANEXO = /^(mirante|belvedere|observatorio|acesso|fenda|entrada)s?( |$)/;

/** Igual, ou um nome contém o outro quando o menor tem pelo menos 8 caracteres. */
export const nomesParecidos = (a: string, b: string): boolean => {
  const na = normalizarNome(a);
  const nb = normalizarNome(b);
  if (!na || !nb) {
    return false;
  }
  if (na === nb) {
    return true;
  }
  const menor = na.length <= nb.length ? na : nb;
  const maior = na.length <= nb.length ? nb : na;
  return menor.length >= 8 && maior.includes(menor);
};

/** Nome de mirante, belvedere ou observatório — não é a serra. */
export const ehMirante = (nome: string): boolean => PREFIXO_MIRANTE.test(normalizarNome(nome));

/** Parada na rota (mirante, acesso, fenda), não o destino em si. */
export const ehAnexoDaRota = (nome: string): boolean =>
  PREFIXO_ANEXO.test(normalizarNome(nome));

/**
 * O lugar É a rota da semente (Serra do Rio do Rastro), não o mirante dela.
 */
export const casaComRota = (nome: string, sementeNome: string): boolean => {
  if (ehAnexoDaRota(nome)) {
    return false;
  }
  if (nomesParecidos(nome, sementeNome)) {
    return true;
  }
  const rota = normalizarNome(sementeNome);
  const distintivo = rota.replace(PREFIXO_ROTA, "");
  if (distintivo.length < 8 || distintivo === rota) {
    return false;
  }
  return normalizarNome(nome).includes(distintivo);
};
