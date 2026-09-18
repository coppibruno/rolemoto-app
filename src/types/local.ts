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
  fotoFachadaUrl: string;
  criadorId: string;
  notaMedia: number;
  totalAvaliacoes: number;
  recomendacoesComboio: number;
  createdAt: string;
  updatedAt: string;
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
  linkMaps: string;
  photoFile: File | null;
};

export type ErrosCriarLocal = {
  nome?: string;
  endereco?: string;
  categoria?: string;
  horario?: string;
  linkMaps?: string;
  foto?: string;
};
