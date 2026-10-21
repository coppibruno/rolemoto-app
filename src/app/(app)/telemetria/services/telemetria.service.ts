import { api, ApiError } from "@/lib/api";
import type {
  ItemHistoricoTelemetria,
  RoleTelemetria,
  RoleTelemetriaCreate,
} from "@/types/role-telemetria";

export const telemetriaService = {
  criar: (dados: RoleTelemetriaCreate) =>
    api<RoleTelemetria>("/telemetria", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  listarMinhas: () => api<RoleTelemetria[]>("/telemetria"),

  listarDeUsuario: (uid: string) =>
    api<ItemHistoricoTelemetria[]>(
      `/usuarios/${encodeURIComponent(uid)}/telemetria`,
    ),

  atualizarVisibilidade: (id: string, publica: boolean) =>
    api<RoleTelemetria>(`/telemetria/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ publica }),
    }),

  buscar: async (id: string): Promise<RoleTelemetria | null> => {
    try {
      return await api<RoleTelemetria>(`/telemetria/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
