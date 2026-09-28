import { ApiError } from "@/lib/api";
import { isErroAuth, isFalhaDeRede } from "@/lib/telemetria/falha-rede";
import { obterAdapterGps } from "@/lib/telemetria/telemetria-gps.adapter";
import type { RoleTelemetria } from "@/types/role-telemetria";
import { telemetriaService } from "../../telemetria/services/telemetria.service";

export type ResultadoSyncResumo =
  | { tipo: "ok"; criado: RoleTelemetria }
  | { tipo: "vazio" }
  | { tipo: "rede" }
  | { tipo: "auth" }
  | { tipo: "validacao"; mensagem: string };

let ocupado = false;
const ouvintes = new Set<(resultado: ResultadoSyncResumo) => void>();

export const onSyncResumo = (
  ouvinte: (resultado: ResultadoSyncResumo) => void,
): (() => void) => {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
};

const notificar = (resultado: ResultadoSyncResumo) => {
  ouvintes.forEach((ouvinte) => ouvinte(resultado));
};

export const avisarFilaVazia = (): void => {
  notificar({ tipo: "vazio" });
};

export const MENSAGEM_SALVO_NO_CELULAR =
  "Salvo no celular. Enviamos quando tiver internet.";

export const MENSAGEM_AUTH_PENDENTE =
  "Entre de novo para enviar o passeio. Ele continua neste celular.";

export const tentarSyncResumoPendente =
  async (): Promise<ResultadoSyncResumo> => {
    if (ocupado) return { tipo: "vazio" };
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { tipo: "rede" };
    }

    ocupado = true;
    try {
      const adapter = await obterAdapterGps();
      const pendente = await adapter.getResumoPendente();
      if (!pendente) return { tipo: "vazio" };

      const criado = await telemetriaService.criar(pendente.dados);
      await adapter.limparResumoPendente();
      const ok = { tipo: "ok" as const, criado };
      notificar(ok);
      return ok;
    } catch (erro) {
      if (isFalhaDeRede(erro)) {
        const rede = { tipo: "rede" as const };
        notificar(rede);
        return rede;
      }
      if (isErroAuth(erro)) {
        const auth = { tipo: "auth" as const };
        notificar(auth);
        return auth;
      }
      const mensagem =
        erro instanceof ApiError
          ? erro.message
          : "Falha ao salvar. Tente de novo.";
      const validacao = { tipo: "validacao" as const, mensagem };
      notificar(validacao);
      return validacao;
    } finally {
      ocupado = false;
    }
  };

export const agendarSyncResumoPendente = (
  onResultado: (resultado: ResultadoSyncResumo) => void,
  debounceMs = 600,
): (() => void) => {
  if (typeof window === "undefined") return () => undefined;
  const id = window.setTimeout(() => {
    void tentarSyncResumoPendente().then(onResultado);
  }, debounceMs);
  return () => window.clearTimeout(id);
};
