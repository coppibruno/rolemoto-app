import type {
  RoleTelemetria,
  RoleTelemetriaNovo,
} from "../../types/role-telemetria";

export interface RoleTelemetriaRepository {
  criar(dados: RoleTelemetriaNovo): Promise<RoleTelemetria>;
  buscarPorId(id: string): Promise<RoleTelemetria | null>;
  listarPorUsuario(
    usuarioId: string,
    opcoes?: {limite?: number},
  ): Promise<RoleTelemetria[]>;
}
