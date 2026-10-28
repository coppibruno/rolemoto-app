import type {
  CategoriaLocal,
  FacilidadeLocal,
  HorarioDiaLocal,
} from "./local";

export type LocalPublico = {
  id: string;
  nome: string;
  endereco: string;
  categoria: CategoriaLocal;
  facilidades: FacilidadeLocal[];
  aberto24h: boolean;
  horarios: HorarioDiaLocal[];
  fotoFachadaUrl: string;
  notaMedia: number;
  totalAvaliacoes: number;
  recomendacoesComboio: number;
};
