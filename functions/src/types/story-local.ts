export type AlbumStory = "local" | "evento" | "perfil";

export type AlbumVisto = AlbumStory | "pessoa";

export interface LocalizacaoStory {
  nome: string;
  lat: number;
  lng: number;
}

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
  marcaX: number | null;
  marcaY: number | null;
  localizacaoNome: string | null;
  localizacaoLat: number | null;
  localizacaoLng: number | null;
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
  marcaX: number | null;
  marcaY: number | null;
  autor: AutorStory;
  mencao: MencaoStory | null;
  localizacao: LocalizacaoStory | null;
}

export interface StoryVisto {
  id: string;
  usuarioId: string;
  album: AlbumVisto;
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

export interface PessoaStory {
  uid: string;
  apelido: string;
  fotoUrl: string;
  contagem: number;
  naoVisto: boolean;
  propria: boolean;
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
