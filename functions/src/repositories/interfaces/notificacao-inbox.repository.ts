import type {
  NotificacaoInbox,
  NotificacaoInboxCreate,
  PaginaNotificacoes,
} from "../../types/notificacao-inbox";

export interface NotificacaoInboxRepository {
  criar(dados: NotificacaoInboxCreate): Promise<NotificacaoInbox>;
  listarDoUsuario(usuarioId: string, cursor: string | null): Promise<PaginaNotificacoes>;
  contarNaoLidas(usuarioId: string): Promise<number>;
  /** `null` se não existe ou não é do uid. */
  marcarLida(id: string, usuarioId: string): Promise<NotificacaoInbox | null>;
  marcarTodasLidas(usuarioId: string): Promise<number>;
  limparPorUsuario(usuarioId: string): Promise<void>;
}
