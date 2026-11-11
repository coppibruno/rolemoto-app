import { api } from "@/lib/api";
import type { ConquistaAdmin, ConquistaDados } from "@/types/conquista";

export const conquistasService = {
  listarAdmin: async (): Promise<ConquistaAdmin[]> =>
    (await api<{ itens: ConquistaAdmin[] }>("/conquistas/admin")).itens,

  criar: (dados: ConquistaDados) =>
    api<ConquistaAdmin>("/conquistas", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  atualizar: (id: string, dados: Partial<ConquistaDados & { ativa: boolean }>) =>
    api<ConquistaAdmin>(`/conquistas/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),
};
