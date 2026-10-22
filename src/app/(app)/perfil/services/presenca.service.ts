import { api } from "@/lib/api";
import type { PontoProximo } from "@/types/ponto-proximo";

export const presencaService = {
  proximo: (lat: number, lng: number, accuracy: number) => {
    const qs = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      accuracy: String(accuracy),
    });
    return api<{ ponto: PontoProximo | null }>(`/locais/proximo?${qs.toString()}`);
  },
};
