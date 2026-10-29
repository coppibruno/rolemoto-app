import { api } from "@/lib/api";
import type {
  AprovarSugestaoLocal,
  FacetaBusca,
  ResultadoBuscaSugestoes,
  SugestaoLocal,
} from "@/types/sugestao-local";

export const sugestoesLocaisService = {
  listar: () => api<{ itens: SugestaoLocal[] }>("/sugestoes-locais"),

  buscar: (facetas: FacetaBusca[]) =>
    api<ResultadoBuscaSugestoes>("/sugestoes-locais/buscar", {
      method: "POST",
      body: JSON.stringify({ facetas }),
    }),

  aprovar: (id: string, dados: AprovarSugestaoLocal) =>
    api<{ localId: string }>(`/sugestoes-locais/${encodeURIComponent(id)}/aprovar`, {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  recusar: (id: string) =>
    api<void>(`/sugestoes-locais/${encodeURIComponent(id)}/recusar`, {
      method: "POST",
    }),
};
