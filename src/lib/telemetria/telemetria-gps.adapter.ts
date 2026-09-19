import type {
  SessaoTelemetriaLocal,
  TelemetriaRoleCreate,
} from "@/types/telemetria-role";

export type ResumoTelemetriaPendente = {
  roleId: string;
  dados: TelemetriaRoleCreate;
};

export type ResultadoStopTelemetria = {
  sessao: SessaoTelemetriaLocal;
  encerradoEm: string;
  dados: TelemetriaRoleCreate;
};

export class TelemetriaGpsErro extends Error {
  constructor(
    public codigo:
      | "nao_nativo"
      | "permissao_background"
      | "sessao_outro_role"
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
  start: (roleId: string) => Promise<SessaoTelemetriaLocal>;
  stop: () => Promise<ResultadoStopTelemetria>;
  limparResumoPendente: () => Promise<void>;
  abrirAjustes: () => Promise<void>;
};

export const obterAdapterGps = async (): Promise<TelemetriaGpsAdapter> => {
  const { podeGravarTelemetriaNativa } = await import("./plataforma");
  if (!podeGravarTelemetriaNativa()) {
    const { webAdapter } = await import("./telemetria-gps.web");
    return webAdapter;
  }
  const { nativeAdapter } = await import("./telemetria-gps.native");
  return nativeAdapter;
};
