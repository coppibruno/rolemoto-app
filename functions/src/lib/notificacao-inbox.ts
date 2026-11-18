import type {
  NotificacaoInboxCreate,
  TipoNotificacaoInbox,
} from "../types/notificacao-inbox";

const NA_INBOX = new Set<string>([
  "pedido_vaga",
  "entrada_role",
  "aceite_vaga",
  "lembrete_role",
  "lembrete_evento",
  "cancelamento_role",
  "novo_seguidor",
  "convite_evento",
  "album_evento",
  "comentario_foto",
  "comentario_atividade",
]);

/** `null` quando o tipo não entra na caixa (mensagem, story_local, desconhecido). */
export const tipoNaInbox = (tipo: string): TipoNotificacaoInbox | null => {
  if (!NA_INBOX.has(tipo)) {
    return null;
  }
  return tipo as TipoNotificacaoInbox;
};

/** Path interno relativo. Exige `/` no início e bloqueia URL absoluta. */
export const urlInboxValida = (url: unknown): string | null => {
  if (typeof url !== "string") {
    return null;
  }
  const limpa = url.trim();
  if (!limpa.startsWith("/") || limpa.startsWith("//")) {
    return null;
  }
  if (limpa.includes("://")) {
    return null;
  }
  return limpa;
};

export type PayloadInbox = {
  tipo: string;
  title: string;
  body: string;
  url: string;
  roleId: string;
  localId: string;
  eventoId: string;
  atorUid?: string | null;
};

/** Monta o create ou `null` se o tipo/url não servem para a caixa. */
export const payloadParaInbox = (
  usuarioId: string,
  payload: PayloadInbox,
): NotificacaoInboxCreate | null => {
  const tipo = tipoNaInbox(payload.tipo);
  const url = urlInboxValida(payload.url);
  if (!tipo || !url) {
    return null;
  }
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!title) {
    return null;
  }
  const ator =
    typeof payload.atorUid === "string" && payload.atorUid.trim() ?
      payload.atorUid.trim() :
      null;
  return {
    usuarioId,
    tipo,
    title,
    body,
    url,
    atorUid: ator,
    roleId: typeof payload.roleId === "string" ? payload.roleId : "",
    localId: typeof payload.localId === "string" ? payload.localId : "",
    eventoId: typeof payload.eventoId === "string" ? payload.eventoId : "",
  };
};
