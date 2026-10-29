import type {CategoriaLocal, HorarioDiaLocal} from "./local";

export type StatusSugestaoLocal = "pendente" | "aprovada" | "recusada";

export interface SugestaoLocal {
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
  aberto24h: boolean;
  horarios: HorarioDiaLocal[];
  horarioCompleto: boolean;
  fotoFachadaUrl: string;
  fotoRecurso: string;
  fotoAtribuicao: string;
  fotoIndisponivel: boolean;
  status: StatusSugestaoLocal;
  localId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FotoSugestaoGravada = {
  fotoFachadaUrl: string;
  fotoRecurso: string;
  fotoAtribuicao: string;
  fotoIndisponivel: boolean;
};

export type SugestaoLocalNova = Omit<
  SugestaoLocal,
  "status" | "localId" | "createdAt" | "updatedAt"
>;
