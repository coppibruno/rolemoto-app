export type AlbumStory = "local" | "evento" | "perfil";

export type MencaoStory = {
  tipo: "local" | "evento";
  id: string;
  nome: string;
};

export type AutorStory = {
  uid: string;
  apelido: string;
  fotoUrl: string;
};

export type StoryPublica = {
  id: string;
  album: AlbumStory;
  localId: string | null;
  eventoId: string | null;
  fotoUrl: string;
  createdAt: string;
  expiresAt: string;
  marcaX: number | null;
  marcaY: number | null;
  autor: AutorStory;
  mencao: MencaoStory | null;
};

export type EventoAoVivoResumo = {
  id: string;
  titulo: string;
};

export type ListaStories = {
  album: AlbumStory;
  localId: string | null;
  eventoId: string | null;
  eventoAoVivo: EventoAoVivoResumo | null;
  stories: StoryPublica[];
};

export type AnelStory = {
  album: AlbumStory;
  localId: string | null;
  eventoId: string | null;
  nome: string;
  fotoUrl: string;
  contagem: number;
  naoVisto: boolean;
  eventoAoVivo: EventoAoVivoResumo | null;
};

export type AlvoPlayer = {
  tipo: "local" | "evento" | "usuario";
  id: string;
};

export type AlvoPostagem =
  | { tipo: "local"; id: string }
  | { tipo: "evento"; id: string; localId: string | null };

export const alvoDoAnel = (anel: AnelStory): AlvoPlayer => {
  if (anel.album === "local" && anel.localId) {
    return { tipo: "local", id: anel.localId };
  }
  return { tipo: "evento", id: anel.eventoId ?? "" };
};

export const destinoUpload = (
  alvo: AlvoPostagem,
): { album: AlbumStory; id: string } => {
  if (alvo.tipo === "local") return { album: "local", id: alvo.id };
  if (alvo.localId) return { album: "local", id: alvo.localId };
  return { album: "evento", id: alvo.id };
};

export const alvoDaStory = (story: {
  album: AlbumStory;
  localId: string | null;
  eventoId: string | null;
  autor: { uid: string };
}): AlvoPlayer | null => {
  if (story.album === "local" && story.localId) {
    return { tipo: "local", id: story.localId };
  }
  if (story.album === "evento" && story.eventoId) {
    return { tipo: "evento", id: story.eventoId };
  }
  if (story.album === "perfil") return { tipo: "usuario", id: story.autor.uid };
  return null;
};
