import type {
  PaginaBloqueios,
  ResultadoBloquear,
  ResultadoDesbloquear,
  VinculoBloqueio,
} from "../../types/moderacao";

/**
 * Bloqueio unidirecional (`usersbloqueio`).
 * Id `{bloqueadorId}_{bloqueadoId}`.
 */
export interface BloqueioRepository {
  bloquear(
    bloqueadorId: string,
    bloqueadoId: string,
  ): Promise<ResultadoBloquear>;
  desbloquear(
    bloqueadorId: string,
    bloqueadoId: string,
  ): Promise<ResultadoDesbloquear>;
  existe(bloqueadorId: string, bloqueadoId: string): Promise<boolean>;
  /** Uids com vínculo nos dois sentidos (sou bloqueador ou bloqueado). */
  setDoPar(uid: string): Promise<Set<string>>;
  listarDoBloqueador(
    bloqueadorId: string,
    cursor: string | null,
  ): Promise<{ok: true; vinculos: VinculoBloqueio[]; proximoCursor: string | null} | {ok: false}>;
  paginaLinhas(
    bloqueadorId: string,
    cursor: string | null,
  ): Promise<{ok: true; pagina: PaginaBloqueios} | {ok: false}>;
  limparPorUsuario(uid: string): Promise<void>;
}
