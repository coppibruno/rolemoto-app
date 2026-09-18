import { api } from "@/lib/api";
import type { Local, LocalPublicacao } from "@/types/local";

export const locaisService = {
  listar: () => api<Local[]>("/locais"),

  buscarPorId: (id: string) => api<Local>(`/locais/${encodeURIComponent(id)}`),

  criar: (dados: LocalPublicacao) =>
    api<Local>("/locais", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
