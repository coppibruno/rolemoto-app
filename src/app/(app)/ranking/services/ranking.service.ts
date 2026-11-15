import { api } from "@/lib/api";
import type { ConquistaAdmin, ConquistaMinha, RankingConquista } from "@/types/conquista";

export const rankingService = {
  listarMeusPinos: async (): Promise<ConquistaMinha[]> =>
    (await api<{ itens: ConquistaMinha[] }>("/conquistas/minhas")).itens ?? [],

  listarTodosPinos: async (): Promise<ConquistaMinha[]> =>
    ((await api<{ itens: ConquistaAdmin[] }>("/conquistas/admin")).itens ?? []).map(
      ({ id, nome }) => ({ id, nome }),
    ),

  placar: (conquistaId: string) =>
    api<RankingConquista>(`/conquistas/${encodeURIComponent(conquistaId)}/ranking`),
};
