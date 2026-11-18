const NAO_LIDAS_MUDARAM = "rolemoto:notificacoes-nao-lidas-mudaram";

const ouvir = (nome: string, fn: () => void): (() => void) => {
  window.addEventListener(nome, fn);
  return () => window.removeEventListener(nome, fn);
};

/** Badge e lista buscam de novo após marcar lida. */
export const avisarNotificacoesMudaram = (): void => {
  window.dispatchEvent(new Event(NAO_LIDAS_MUDARAM));
};

export const ouvirNotificacoesMudaram = (fn: () => void): (() => void) =>
  ouvir(NAO_LIDAS_MUDARAM, fn);
