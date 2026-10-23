import type {
  HistoricoOculto,
  HistoricoOcultoCreate,
} from "../../types/historico-oculto";

export interface HistoricoOcultoRepository {
  criar(dados: HistoricoOcultoCreate): Promise<HistoricoOculto>;
  listarPorUsuario(usuarioId: string): Promise<HistoricoOculto[]>;
}
