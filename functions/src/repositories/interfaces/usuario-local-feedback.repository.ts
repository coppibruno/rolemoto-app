import type {
  AvaliacaoExperienciaCreate,
  UsuarioLocalFeedbackDoc,
} from "../../types/avaliacao-experiencia";

/**
 * Contrato de persistência do relato usuário ↔ local (`userslocalfeedback`).
 */
export interface UsuarioLocalFeedbackRepository {
  buscarPorId(id: string): Promise<UsuarioLocalFeedbackDoc | null>;
  buscarPorUsuarioELocal(
    usuarioId: string,
    localId: string,
  ): Promise<UsuarioLocalFeedbackDoc | null>;
  buscarPorIds(ids: string[]): Promise<UsuarioLocalFeedbackDoc[]>;
  listarPorLocal(
    localId: string,
    limite?: number,
  ): Promise<UsuarioLocalFeedbackDoc[]>;
  criar(
    dados: AvaliacaoExperienciaCreate,
  ): Promise<UsuarioLocalFeedbackDoc | "conflito">;
}
