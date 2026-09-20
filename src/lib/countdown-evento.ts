const MINUTO_MS = 60_000;
const HORA_MS = 60 * MINUTO_MS;
const DIA_MS = 24 * HORA_MS;

export const eventoEncerrado = (
  aberturaIso: string,
  encerramentoIso: string | null,
  agora = Date.now(),
): boolean => {
  const limite = Date.parse(encerramentoIso ?? aberturaIso);
  return Number.isFinite(limite) && limite <= agora;
};

export const labelCountdownEvento = (
  aberturaIso: string,
  encerramentoIso: string | null,
  agora = Date.now(),
): string => {
  if (eventoEncerrado(aberturaIso, encerramentoIso, agora)) return "Encerrado";

  const abertura = Date.parse(aberturaIso);
  if (!Number.isFinite(abertura)) return "Encerrado";

  const falta = abertura - agora;
  if (falta <= 0) return "Hoje";
  if (falta < HORA_MS) return "Começa em breve";
  if (falta < DIA_MS) {
    const horas = Math.max(1, Math.round(falta / HORA_MS));
    return `Faltam ${horas} h`;
  }

  const dias = Math.round(falta / DIA_MS);
  return `Faltam ${dias} ${dias === 1 ? "dia" : "dias"}`;
};
