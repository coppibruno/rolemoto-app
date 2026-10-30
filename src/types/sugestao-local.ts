import type { CategoriaLocal, HorarioDiaLocal } from "./local";

export const FACETAS_BUSCA = [
  "turismo",
  "restaurante",
  "padaria",
  "cafe",
  "mirante",
  "natureza",
] as const;

export type FacetaBusca = (typeof FACETAS_BUSCA)[number];

/** Ponto turístico (serra) ligado. Mirante começa desligado. */
export const FACETAS_PADRAO: FacetaBusca[] = FACETAS_BUSCA.filter(
  (faceta) => faceta !== "mirante",
);

export const ROTULO_FACETA: Record<FacetaBusca, string> = {
  turismo: "Ponto turístico",
  restaurante: "Restaurante",
  padaria: "Padaria",
  cafe: "Café",
  mirante: "Mirante",
  natureza: "Natureza",
};

export type StatusSugestaoLocal = "pendente" | "aprovada" | "recusada";

export type SugestaoLocal = {
  id: string;
  placeId: string;
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
  categoriaSugerida: CategoriaLocal;
  nota: number;
  motivos: string[];
  sementeId: string;
  sementeNome: string;
  distanciaSementeKm: number;
  linkMaps: string;
  fotoFachadaUrl: string;
  fotoAtribuicao: string;
  aberto24h: boolean;
  horarios: HorarioDiaLocal[];
  horarioCompleto: boolean;
  status: StatusSugestaoLocal;
  localId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AprovarSugestaoLocal = {
  nome?: string;
  endereco?: string;
  categoria: CategoriaLocal;
  facilidades?: string[];
  aberto24h: boolean;
  horarios?: HorarioDiaLocal[];
};

export type ResultadoBuscaSugestoes = {
  sementes: string[];
  lidas: number;
  gravadas: number;
  ignoradas: number;
};
