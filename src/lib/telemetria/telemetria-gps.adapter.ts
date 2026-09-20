import type {
  RoleTelemetriaCreate,
  SessaoTelemetriaLocal,
} from "@/types/role-telemetria";

export type ResumoTelemetriaPendente = {
  dados: RoleTelemetriaCreate;
};

export type ResultadoStopTelemetria = {
  sessao: SessaoTelemetriaLocal;
  encerradoEm: string;
  dados: RoleTelemetriaCreate;
};

export class TelemetriaGpsErro extends Error {
  constructor(
    public codigo:
      | "nao_nativo"
      | "permissao_background"
      | "sessao_ativa"
      | "sem_sessao",
    message: string,
  ) {
    super(message);
    this.name = "TelemetriaGpsErro";
  }
}

export type TelemetriaGpsAdapter = {
  isNative: () => boolean;
  getSession: () => Promise<SessaoTelemetriaLocal | null>;
  getResumoPendente: () => Promise<ResumoTelemetriaPendente | null>;
  start: () => Promise<SessaoTelemetriaLocal>;
  stop: () => Promise<ResultadoStopTelemetria>;
  limparResumoPendente: () => Promise<void>;
  abrirAjustes: () => Promise<void>;
};

export const obterAdapterGps = async (): Promise<TelemetriaGpsAdapter> => {
  try {
    const { podeGravarTelemetriaNativa } = await import("./plataforma");
    if (!podeGravarTelemetriaNativa()) {
      const { webAdapter } = await import("./telemetria-gps.web");
      return webAdapter;
    }
    const { nativeAdapter } = await import("./telemetria-gps.native");
    return nativeAdapter;
  } catch {
    const { webAdapter } = await import("./telemetria-gps.web");
    return webAdapter;
  }
};
