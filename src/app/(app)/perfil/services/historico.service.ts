import { api } from "@/lib/api";
import type { HistoricoPistas } from "@/types/historico-pistas";

export const historicoService = {
  buscar: () => api<HistoricoPistas>("/perfil/historico"),
};
