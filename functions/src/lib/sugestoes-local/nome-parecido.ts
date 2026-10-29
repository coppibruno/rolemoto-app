export const normalizarNome = (valor: string): string =>
  valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

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
