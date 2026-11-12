import { api } from "@/lib/api";
import type { CheckinLocalResposta } from "@/types/checkin-local";
import type { LocalDetalhe } from "@/types/local";

export const localDetalheService = {
  buscar: (id: string) => api<LocalDetalhe>(`/locais/${encodeURIComponent(id)}`),

  excluir: (id: string) =>
    api<void>(`/locais/${encodeURIComponent(id)}`, { method: "DELETE" }),
  checkin: (id: string, lat: number, lng: number, accuracy: number) =>
    api<CheckinLocalResposta>(`/locais/${encodeURIComponent(id)}/checkin`, {
      method: "POST",
      body: JSON.stringify({ lat, lng, accuracy }),
    }),
};
