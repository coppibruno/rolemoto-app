import type {SituacaoConvites} from "../../types/convite-evento";

/**
 * Convite de evento (`usersconviteevento`). A transação e a limpeza ficam aqui.
 */
export interface ConviteEventoRepository {
  presentes(
    convidanteId: string,
    eventoId: string,
    uids: string[],
  ): Promise<SituacaoConvites>;
  criar(
    convidanteId: string,
    eventoId: string,
    convidadoIds: string[],
  ): Promise<string[]>;
  limparPorUsuario(uid: string): Promise<void>;
}
