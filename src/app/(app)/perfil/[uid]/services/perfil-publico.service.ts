import { api, ApiError } from "@/lib/api";
import type { HistoricoPublico, PerfilPublico } from "@/types/perfil-publico";

export const perfilPublicoService = {
  buscar: async (uid: string): Promise<PerfilPublico | null> => {
    try {
      return await api<PerfilPublico>(`/usuarios/${encodeURIComponent(uid)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  historico: (uid: string) =>
    api<HistoricoPublico>(
      `/usuarios/${encodeURIComponent(uid)}/historico`,
    ),
};
