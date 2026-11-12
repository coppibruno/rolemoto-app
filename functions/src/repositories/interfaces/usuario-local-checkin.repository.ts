import type {
  UsuarioLocalCheckin,
  UsuarioLocalCheckinCreate,
} from "../../types/checkin-local";

/**
 * Contrato de persistência do check-in usuário ↔ local (`userslocalcheckin`).
 */
export interface UsuarioLocalCheckinRepository {
  buscarUltimoPorUsuarioELocal(
    usuarioId: string,
    localId: string,
  ): Promise<UsuarioLocalCheckin | null>;
  listarPorUsuario(usuarioId: string): Promise<UsuarioLocalCheckin[]>;
  /** Documentos, não pilotos distintos. */
  contarPorLocalDesde(localId: string, desde: Date): Promise<number>;
  criar(dados: UsuarioLocalCheckinCreate): Promise<UsuarioLocalCheckin>;
  removerPorLocal(localId: string): Promise<number>;
}
