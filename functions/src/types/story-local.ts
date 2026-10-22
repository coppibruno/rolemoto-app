export type AlbumStory = "local" | "evento" | "perfil";

export interface MencaoStory {
  tipo: "local" | "evento";
  id: string;
  nome: string;
}

export interface AutorStory {
  uid: string;
  apelido: string;
  fotoUrl: string;
}

export interface StoryLocal {
  id: string;
  usuarioId: string;
  album: AlbumStory;
  localId: string | null;
  eventoId: string | null;
  fotoUrl: string;
  storagePath: string;
  createdAt: string;
  expiresAt: string;
}

export type StoryLocalCreate = Omit<StoryLocal, "id" | "createdAt" | "expiresAt">;

export interface StoryPublica {
  id: string;
  album: AlbumStory;
  localId: string | null;
  eventoId: string | null;
  fotoUrl: string;
  createdAt: string;
  expiresAt: string;
  autor: AutorStory;
  mencao: MencaoStory | null;
}

export interface StoryVisto {
  id: string;
  usuarioId: string;
  album: AlbumStory;
  localId: string | null;
  eventoId: string | null;
  vistoAte: string;
  updatedAt: string;
}

export type StoryVistoGravacao = Omit<StoryVisto, "updatedAt">;

export interface EventoAoVivoResumo {
  id: string;
  titulo: string;
}

export interface ListaStories {
  album: AlbumStory;
  localId: string | null;
  eventoId: string | null;
  eventoAoVivo: EventoAoVivoResumo | null;
  stories: StoryPublica[];
}

export interface AnelStory {
  album: AlbumStory;
  localId: string | null;
  eventoId: string | null;
  nome: string;
  fotoUrl: string;
  contagem: number;
  naoVisto: boolean;
  eventoAoVivo: EventoAoVivoResumo | null;
}
