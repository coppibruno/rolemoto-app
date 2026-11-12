import type {
  PaginaVinculos,
  ResultadoDeixarSeguir,
  ResultadoSeguir,
  VinculoEntre,
} from "../../types/seguir";

/**
 * Vínculo de seguir. A transação e a limpeza da conta ficam aqui.
 */
export interface SeguirRepository {
  seguir(seguidorId: string, seguidoId: string): Promise<ResultadoSeguir>;
  deixarDeSeguir(
    seguidorId: string,
    seguidoId: string,
  ): Promise<ResultadoDeixarSeguir>;
  listarSeguindo(uid: string, cursor: string | null): Promise<PaginaVinculos>;
  listarSeguidores(uid: string, cursor: string | null): Promise<PaginaVinculos>;
  /** Uids que `uid` segue, `createdAt` desc, no máximo `limite` vínculos lidos. */
  listarSeguidosRecentes(uid: string, limite: number): Promise<string[]>;
  vinculosCom(
    tokenUid: string,
    uids: string[],
  ): Promise<Map<string, VinculoEntre>>;
  limparPorUsuario(uid: string): Promise<void>;
}
