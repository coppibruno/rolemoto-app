import type {MedalhaTelemetria} from "../../types/conquista";
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
  atualizarVisibilidade(id: string, publica: boolean): Promise<RoleTelemetria | null>;
  /** Grava a lista inteira; `criar` já deixa `[]`. */
  atualizarMedalhas(id: string, medalhas: MedalhaTelemetria[]): Promise<void>;
  excluir(id: string): Promise<void>;
}
