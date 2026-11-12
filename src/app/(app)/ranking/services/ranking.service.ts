import { api } from "@/lib/api";
import type { ConquistaCatalogo, RankingConquista } from "@/types/conquista";

export const rankingService = {
  listarPinos: async (): Promise<ConquistaCatalogo[]> =>
    (await api<{ itens: ConquistaCatalogo[] }>("/conquistas")).itens ?? [],

  placar: (conquistaId: string) =>
    api<RankingConquista>(`/conquistas/${encodeURIComponent(conquistaId)}/ranking`),
};
