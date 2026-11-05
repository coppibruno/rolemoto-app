type EventoAberto = {
  cancelada: boolean;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
};

/** Convite só com a data aberta e sem cancelamento. No instante do limite ainda vale. */
export const eventoAceitaConvite = (evento: EventoAberto): boolean => {
  if (evento.cancelada) return false;
  const limite = evento.dataHoraEncerramento ?? evento.dataHoraAbertura;
  const instante = Date.parse(limite);
  return Number.isFinite(instante) && instante >= Date.now();
};
