import { ApiError, api } from "@/lib/api";
import type { Evento } from "@/types/evento";
import type { Local } from "@/types/local";
import type {
  AvaliacaoCreate,
  AvaliacaoExperiencia,
  TipoAlvoAvaliacao,
} from "@/types/avaliacao-experiencia";

const base = (tipo: TipoAlvoAvaliacao, id: string) =>
  tipo === "local" ? `/locais/${id}` : `/eventos/${id}`;

export const avaliacaoService = {
  buscarAlvo: (tipo: TipoAlvoAvaliacao, id: string) =>
    tipo === "local"
      ? api<Local & { avaliado?: boolean }>(`/locais/${id}`)
      : api<Evento & { avaliado?: boolean; inscrito?: boolean }>(
          `/eventos/${id}`,
        ),

  buscarMinha: async (
    tipo: TipoAlvoAvaliacao,
    id: string,
  ): Promise<AvaliacaoExperiencia | null> => {
    try {
      return await api<AvaliacaoExperiencia>(`${base(tipo, id)}/avaliacao`);
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 404) {
        return null;
      }
      throw erro;
    }
  },

  listar: (tipo: TipoAlvoAvaliacao, id: string) =>
    api<AvaliacaoExperiencia[]>(`${base(tipo, id)}/avaliacoes`),

  publicar: (
    tipo: TipoAlvoAvaliacao,
    id: string,
    dados: AvaliacaoCreate,
  ) =>
    api<AvaliacaoExperiencia>(`${base(tipo, id)}/avaliacoes`, {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  atualizar: (
    tipo: TipoAlvoAvaliacao,
    id: string,
    dados: AvaliacaoCreate,
  ) =>
    api<AvaliacaoExperiencia>(`${base(tipo, id)}/avaliacao`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),
};
