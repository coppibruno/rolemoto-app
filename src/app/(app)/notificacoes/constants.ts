import type { TipoNotificacaoInbox } from "@/types/notificacao";

export const COPY = {
  titulo: "Notificações",
  marcarTodas: "Marcar todas",
  empty: "Nenhuma notificação ainda.",
  erro: "Não foi possível carregar as notificações.",
  tentar: "Tentar de novo",
} as const;

export const iconeDoTipo = (tipo: TipoNotificacaoInbox): string => {
  switch (tipo) {
    case "pedido_vaga":
    case "entrada_role":
    case "aceite_vaga":
    case "lembrete_role":
    case "cancelamento_role":
      return "two_wheeler";
    case "lembrete_evento":
    case "convite_evento":
    case "album_evento":
      return "event";
    case "novo_seguidor":
      return "person_add";
    case "comentario_foto":
    case "comentario_atividade":
      return "chat_bubble";
    default:
      return "notifications";
  }
};
