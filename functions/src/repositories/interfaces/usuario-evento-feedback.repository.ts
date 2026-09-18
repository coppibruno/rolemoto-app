import type {
  AvaliacaoExperienciaCreate,
  UsuarioEventoFeedbackDoc,
} from "../../types/avaliacao-experiencia";

/**
 * Contrato de persistência do relato usuário ↔ evento (`userseventofeedback`).
 */
export interface UsuarioEventoFeedbackRepository {
  buscarPorId(id: string): Promise<UsuarioEventoFeedbackDoc | null>;
  buscarPorUsuarioEEvento(
    usuarioId: string,
    eventoId: string,
  ): Promise<UsuarioEventoFeedbackDoc | null>;
  buscarPorIds(ids: string[]): Promise<UsuarioEventoFeedbackDoc[]>;
  listarPorEvento(
    eventoId: string,
    limite?: number,
  ): Promise<UsuarioEventoFeedbackDoc[]>;
  criar(
    dados: AvaliacaoExperienciaCreate,
  ): Promise<UsuarioEventoFeedbackDoc | "conflito">;
}
