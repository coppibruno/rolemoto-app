import type {
  TelemetriaRole,
  TelemetriaRoleCreate,
} from "../../types/telemetria-role";

/**
 * Contrato de persistência da telemetria usuário ↔ rolê (`userstelemetria`).
 */
export interface TelemetriaRoleRepository {
  buscarPorId(id: string): Promise<TelemetriaRole | null>;
  criar(dados: TelemetriaRoleCreate): Promise<TelemetriaRole | "conflito">;
}
