import type {
  Conversa,
  Mensagem,
  MensagemNova,
  PaginaRepo,
} from "../../types/conversa";

/** Conversas por par e mensagens. O cliente não lê o Firestore. */
export interface ConversaRepository {
  buscarPorId(id: string): Promise<Conversa | null>;
  /** Cria a conversa se não existe, grava a mensagem e o resumo na mesma transação. */
  enviar(dados: MensagemNova): Promise<Mensagem>;
  listarDoUsuario(uid: string, cursor: string | null): Promise<PaginaRepo<Conversa>>;
  listarMensagens(
    conversaId: string,
    cursor: string | null,
  ): Promise<PaginaRepo<Mensagem>>;
  /** Apaga as conversas do uid e as mensagens delas. */
  limparPorUsuario(uid: string): Promise<void>;
}
