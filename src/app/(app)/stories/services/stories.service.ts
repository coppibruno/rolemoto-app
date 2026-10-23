import { api } from "@/lib/api";
import type { PontoFeed, RaioKm } from "@/app/(app)/feed/types";
import type {
  AlvoPlayer,
  AlvoPostagem,
  AnelStory,
  ListaStories,
  StoryPublica,
} from "@/types/story-local";

const caminho = (alvo: { tipo: AlvoPlayer["tipo"]; id: string }): string => {
  const id = encodeURIComponent(alvo.id);
  if (alvo.tipo === "usuario") return `/usuarios/${id}/stories`;
  return alvo.tipo === "local" ? `/locais/${id}/stories` : `/eventos/${id}/stories`;
};

export const storiesService = {
  listar: async (alvo: AlvoPlayer): Promise<ListaStories> => {
    if (alvo.tipo === "usuario") {
      const dados = await api<{ stories: StoryPublica[] }>(caminho(alvo));
      return {
        album: "perfil",
        localId: null,
        eventoId: null,
        eventoAoVivo: null,
        stories: dados.stories,
      };
    }
    return api<ListaStories>(caminho(alvo));
  },

  postar: (
    alvo: AlvoPostagem,
    body: { lat: number; lng: number; accuracy: number; fotoUrl: string },
  ) =>
    api<StoryPublica>(caminho(alvo), {
      method: "POST",
      body: JSON.stringify(body),
    }),

  visto: (alvo: AlvoPlayer, storyId: string) =>
    api<void>(`${caminho(alvo)}/visto`, {
      method: "POST",
      body: JSON.stringify({ storyId }),
    }),

  apagar: (alvo: AlvoPlayer, storyId: string) =>
    api<void>(`${caminho(alvo)}/${encodeURIComponent(storyId)}`, {
      method: "DELETE",
    }),

  resumo: (uid: string) =>
    api<{ storiesAtivas: number }>(
      `/usuarios/${encodeURIComponent(uid)}/stories?resumo=1`,
    ),

  postarNoPerfil: (body: {
    fotoUrl: string;
    localId?: string;
    eventoId?: string;
    lat?: number;
    lng?: number;
    accuracy?: number;
    marcaX?: number;
    marcaY?: number;
  }) =>
    api<StoryPublica>("/stories", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  aoVivo: (aba: "locais" | "eventos", ponto: PontoFeed | null, raioKm: RaioKm) => {
    const qs = new URLSearchParams({ aba });
    if (ponto) {
      qs.set("lat", String(ponto.lat));
      qs.set("lng", String(ponto.lng));
      if (raioKm) qs.set("raioKm", String(raioKm));
    }
    return api<{ aneis: AnelStory[] }>(`/stories/ao-vivo?${qs.toString()}`);
  },
};
