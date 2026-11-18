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

export type AtorNotificacao = {
  uid: string;
  nome: string;
  fotoUrl: string;
};

export type NotificacaoInboxItem = {
  id: string;
  tipo: TipoNotificacaoInbox;
  title: string;
  body: string;
  url: string;
  lida: boolean;
  createdAt: string;
  ator: AtorNotificacao | null;
};

export type PaginaNotificacoes = {
  itens: NotificacaoInboxItem[];
  nextCursor: string | null;
};

export type NaoLidasNotificacoes = {
  total: number;
};
