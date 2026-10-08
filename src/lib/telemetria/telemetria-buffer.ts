import { registerPlugin } from "@capacitor/core";
import type { PontoGps } from "./calcular-metricas";

export type TelemetriaBufferPlugin = {
  iniciar: () => Promise<void>;
  garantir: () => Promise<void>;
  parar: () => Promise<void>;
  listar: () => Promise<{ pontos: PontoGps[] }>;
  limpar: () => Promise<void>;
  statusEnergia: () => Promise<{ economiaAtiva: boolean; afetaGps: boolean }>;
  abrirAjustesEconomia: () => Promise<void>;
};

const plugin = registerPlugin<TelemetriaBufferPlugin>("TelemetriaBuffer", {
  web: () =>
    import("./telemetria-buffer.web").then((m) => new m.TelemetriaBufferWeb()),
});

const silenciar = async (acao: () => Promise<void>): Promise<void> => {
  try {
    await acao();
  } catch {
    /* plugin ausente no PWA / web */
  }
};

export const telemetriaBuffer = {
  iniciar: () => silenciar(() => plugin.iniciar()),
  garantir: () => silenciar(() => plugin.garantir()),
  parar: () => silenciar(() => plugin.parar()),
  limpar: () => silenciar(() => plugin.limpar()),
  abrirAjustesEconomia: () => silenciar(() => plugin.abrirAjustesEconomia()),
  /** APK sem o método (antes do versionCode 3) não bloqueia: segue o fluxo antigo. */
  economiaAfetaGps: async (): Promise<boolean> => {
    try {
      const { afetaGps } = await plugin.statusEnergia();
      return afetaGps === true;
    } catch {
      return false;
    }
  },
  listar: async (): Promise<PontoGps[]> => {
    try {
      const { pontos } = await plugin.listar();
      if (!Array.isArray(pontos)) return [];
      return pontos.map((ponto) => ({
        lat: Number(ponto.lat),
        lng: Number(ponto.lng),
        t: Number(ponto.t),
        speed: ponto.speed == null ? null : Number(ponto.speed),
        accuracy: ponto.accuracy == null ? null : Number(ponto.accuracy),
        provider: ponto.provider == null ? null : String(ponto.provider),
      }));
    } catch {
      return [];
    }
  },
};
