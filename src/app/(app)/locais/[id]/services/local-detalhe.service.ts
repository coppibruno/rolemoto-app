import { api } from "@/lib/api";
import type { LocalDetalhe } from "@/types/local";

export const localDetalheService = {
  buscar: (id: string) => api<LocalDetalhe>(`/locais/${encodeURIComponent(id)}`),
};
