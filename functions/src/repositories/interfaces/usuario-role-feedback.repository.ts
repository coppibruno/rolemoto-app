import type {
  UsuarioRoleFeedbackCreate,
  UsuarioRoleFeedbackDoc,
} from "../../types/usuario-role-feedback";

/**
 * Contrato de persistência do relato usuário ↔ rolê (`usersrolefeedback`).
 */
export interface UsuarioRoleFeedbackRepository {
  buscarPorId(id: string): Promise<UsuarioRoleFeedbackDoc | null>;
  buscarPorUsuarioERole(
    usuarioId: string,
    roleId: string,
  ): Promise<UsuarioRoleFeedbackDoc | null>;
  buscarPorIds(ids: string[]): Promise<UsuarioRoleFeedbackDoc[]>;
  listarPorRole(roleId: string): Promise<UsuarioRoleFeedbackDoc[]>;
  criar(
    dados: UsuarioRoleFeedbackCreate,
  ): Promise<UsuarioRoleFeedbackDoc | "conflito">;
}
