import type {EstadoCalculo} from "../../lib/calcular-metricas-telemetria";
import type {
  TelemetriaSessao,
  TelemetriaSessaoNovo,
} from "../../types/telemetria-sessao";

export type TelemetriaSessaoInterna = TelemetriaSessao & {
  tokenHash: string;
};

export interface TelemetriaSessaoRepository {
  criar(dados: TelemetriaSessaoNovo): Promise<TelemetriaSessao>;
  buscarPorId(id: string): Promise<TelemetriaSessaoInterna | null>;
  aplicarPontoTransacao(
    id: string,
    tokenHash: string,
    aplicar: (estado: EstadoCalculo) => EstadoCalculo,
  ): Promise<boolean>;
  excluir(id: string): Promise<void>;
  excluirPorUsuario(usuarioId: string): Promise<void>;
}
