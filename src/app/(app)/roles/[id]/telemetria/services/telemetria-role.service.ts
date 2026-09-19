import { api } from "@/lib/api";
import type {
  TelemetriaRole,
  TelemetriaRoleCreate,
} from "@/types/telemetria-role";

export const telemetriaRoleService = {
  buscarMinha: (roleId: string) =>
    api<TelemetriaRole>(`/roles/${roleId}/telemetria`),

  publicar: (roleId: string, dados: TelemetriaRoleCreate) =>
    api<TelemetriaRole>(`/roles/${roleId}/telemetria`, {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
