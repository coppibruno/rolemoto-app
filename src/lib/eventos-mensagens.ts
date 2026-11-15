const PUSH_RECEBIDO = "rolemoto:push-recebido";
const NAO_LIDAS_MUDARAM = "rolemoto:nao-lidas-mudaram";

const ouvir = (nome: string, fn: () => void): (() => void) => {
  window.addEventListener(nome, fn);
  return () => window.removeEventListener(nome, fn);
};

/** Push com o app aberto: conversa e contador buscam de novo. */
export const avisarPushRecebido = (): void => {
  window.dispatchEvent(new Event(PUSH_RECEBIDO));
};

export const ouvirPushRecebido = (fn: () => void): (() => void) => ouvir(PUSH_RECEBIDO, fn);

/** Uma conversa foi aberta (lida) ou uma mensagem saiu: o contador busca de novo. */
export const avisarNaoLidasMudaram = (): void => {
  window.dispatchEvent(new Event(NAO_LIDAS_MUDARAM));
};

export const ouvirNaoLidasMudaram = (fn: () => void): (() => void) =>
  ouvir(NAO_LIDAS_MUDARAM, fn);
