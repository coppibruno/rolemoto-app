const PUSH_RECEBIDO = "rolemoto:push-recebido";
const NAO_LIDAS_MUDARAM = "rolemoto:nao-lidas-mudaram";

/** Mensagem do service worker ao focar/abrir URL de notificação. */
export const MSG_PUSH_CLICADO = "rolemoto:push-clicado";

const ouvir = (nome: string, fn: () => void): (() => void) => {
  window.addEventListener(nome, fn);
  return () => window.removeEventListener(nome, fn);
};

/** Push com o app aberto: conversa e contador buscam de novo. */
export const avisarPushRecebido = (): void => {
  window.dispatchEvent(new Event(PUSH_RECEBIDO));
};

/** Liga o postMessage do SW (clique na notificação web) ao mesmo refresh. */
export const ouvirPushClicadoDoSw = (): (() => void) => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return () => undefined;
  }
  const aoMensagem = (evento: MessageEvent) => {
    const data = evento.data as { type?: string } | null;
    if (data?.type === MSG_PUSH_CLICADO) {
      avisarPushRecebido();
    }
  };
  navigator.serviceWorker.addEventListener("message", aoMensagem);
  return () => navigator.serviceWorker.removeEventListener("message", aoMensagem);
};

export const ouvirPushRecebido = (fn: () => void): (() => void) => ouvir(PUSH_RECEBIDO, fn);

/** Uma conversa foi aberta (lida) ou uma mensagem saiu: o contador busca de novo. */
export const avisarNaoLidasMudaram = (): void => {
  window.dispatchEvent(new Event(NAO_LIDAS_MUDARAM));
};

export const ouvirNaoLidasMudaram = (fn: () => void): (() => void) =>
  ouvir(NAO_LIDAS_MUDARAM, fn);
