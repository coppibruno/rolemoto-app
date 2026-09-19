import type { SessaoTelemetriaLocal } from "@/types/telemetria-role";
import {
  TelemetriaGpsErro,
  type ResultadoStopTelemetria,
  type TelemetriaGpsAdapter,
} from "./telemetria-gps.adapter";

export const webAdapter: TelemetriaGpsAdapter = {
  isNative: () => false,
  getSession: async () => null,
  getResumoPendente: async () => null,
  start: async (_roleId: string): Promise<SessaoTelemetriaLocal> => {
    throw new TelemetriaGpsErro(
      "nao_nativo",
      "Telemetria com tela desligada só no app Rolemoto (Android/iOS).",
    );
  },
  stop: async (): Promise<ResultadoStopTelemetria> => {
    throw new TelemetriaGpsErro("nao_nativo", "Sem sessão nativa.");
  },
  limparResumoPendente: async () => undefined,
  abrirAjustes: async () => undefined,
};
