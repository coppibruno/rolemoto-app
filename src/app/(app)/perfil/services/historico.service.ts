import { api } from "@/lib/api";
import type { HistoricoPistas } from "@/types/historico-pistas";

export const historicoService = {
  buscar: () => api<HistoricoPistas>("/perfil/historico"),
  ocultar: (tipo: "role" | "evento", id: string) =>
    api<void>("/perfil/historico/ocultar", {
      method: "POST",
      body: JSON.stringify({ tipo, id }),
    }),
};
