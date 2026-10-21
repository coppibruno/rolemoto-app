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
  criar(dados: UsuarioLocalCheckinCreate): Promise<UsuarioLocalCheckin>;
}
