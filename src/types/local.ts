import type { DonoLocal, OfertaVigenteResumo } from "./oferta-local";
import type { EventoAoVivoResumo } from "./story-local";

export type CategoriaLocal =
  | "posto"
  | "bar_moto_point"
  | "restaurante_estrada"
  | "oficina"
  | "mirante";

export type FacilidadeLocal =
  | "patio_amplo_50"
  | "calibrador_alta_pressao"
  | "banheiros_limpos"
  | "conveniencia_cafe"
  | "wifi_aberto"
  | "cameras_24h";

/** 0 = domingo … 6 = sábado (mesmo índice do `Date.getDay()`). */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type HorarioDiaLocal = {
  dia: DiaSemana;
  fechado: boolean;
  abertura: string | null;
  fechamento: string | null;
};

export interface Local {
  id: string;
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
  categoria: CategoriaLocal;
  facilidades: FacilidadeLocal[];
  aberto24h: boolean;
  horarios: HorarioDiaLocal[];
  linkMaps: string;
  /** Capa dos cards. Primeira entrada de `fotosUrls`. */
  fotoFachadaUrl: string;
  /** Galeria do detalhe, até 5. A primeira é a capa. */
  fotosUrls: string[];
  fotoAtribuicao?: string;
  googlePlaceId?: string | null;
  criadorId: string;
  notaMedia: number;
  totalAvaliacoes: number;
  recomendacoesComboio: number;
  createdAt: string;
  updatedAt: string;
  /** `GET /locais` e `GET /locais/:id`. `null` sem oferta no ar. */
  ofertaVigente?: OfertaVigenteResumo | null;
}

export type LocalPublicacao = Omit<
  Local,
  | "id"
  | "criadorId"
  | "createdAt"
  | "updatedAt"
  | "notaMedia"
  | "totalAvaliacoes"
  | "recomendacoesComboio"
>;

export type LocalFeedItem = Local & {
  distanciaKm: number;
  avaliado: boolean;
  favorito: boolean;
};

export type LocalDetalhe = Local & {
  avaliado: boolean;
  favorito: boolean;
  checkinProprio: boolean;
  storiesAtivas: number;
  eventoAoVivo: EventoAoVivoResumo | null;
  souDono: boolean;
  /** Só vem para admin. */
  dono?: DonoLocal | null;
};

export type HorarioDiaForm = {
  dia: DiaSemana;
  fechado: boolean;
  abertura: string;
  fechamento: string;
};

export type CriarLocalForm = {
  nome: string;
  endereco: string;
  lat: number | null;
  lng: number | null;
  categoria: CategoriaLocal | null;
  facilidades: FacilidadeLocal[];
  aberto24h: boolean;
  horarios: HorarioDiaForm[];
  fotos: File[];
};

export type ErrosCriarLocal = {
  nome?: string;
  endereco?: string;
  categoria?: string;
  horario?: string;
  foto?: string;
};
