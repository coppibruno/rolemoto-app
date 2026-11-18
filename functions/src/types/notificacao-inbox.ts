/** Subset de push que entra na caixa in-app (SPEC 068). Sem `mensagem` nem `story_local`. */
export type TipoNotificacaoInbox =
  | "pedido_vaga"
  | "entrada_role"
  | "aceite_vaga"
  | "lembrete_role"
  | "lembrete_evento"
  | "cancelamento_role"
  | "novo_seguidor"
  | "convite_evento"
  | "album_evento"
  | "comentario_foto"
  | "comentario_atividade";

export type NotificacaoInbox = {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacaoInbox;
  title: string;
  body: string;
  url: string;
  lida: boolean;
  atorUid: string | null;
  roleId: string;
  localId: string;
  eventoId: string;
  createdAt: string;
};

export type NotificacaoInboxCreate = {
  usuarioId: string;
  tipo: TipoNotificacaoInbox;
  title: string;
  body: string;
  url: string;
  atorUid: string | null;
  roleId: string;
  localId: string;
  eventoId: string;
};

export type NotificacaoInboxItem = {
  id: string;
  tipo: TipoNotificacaoInbox;
  title: string;
  body: string;
  url: string;
  lida: boolean;
  createdAt: string;
  ator: {uid: string; nome: string; fotoUrl: string} | null;
};

export type PaginaNotificacoes =
  | {
    ok: true;
    itens: NotificacaoInbox[];
    proximoCursor: string | null;
  }
  | {ok: false};

export const LIMITE_PAGINA_NOTIFICACOES = 30;
