import { api } from "@/lib/api";
import type { ConquistaMinha, RankingConquista } from "@/types/conquista";

export const rankingService = {
  listarMeusPinos: async (): Promise<ConquistaMinha[]> =>
    (await api<{ itens: ConquistaMinha[] }>("/conquistas/minhas")).itens ?? [],

  placar: (conquistaId: string) =>
    api<RankingConquista>(`/conquistas/${encodeURIComponent(conquistaId)}/ranking`),
};
