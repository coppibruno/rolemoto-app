import type {CategoriaLocal, FacilidadeLocal, HorarioDiaLocal} from "./local";

/** DTO sanitizado do convite — sem lat/lng, sem link do Maps, sem criador. */
export type LocalPublico = {
  id: string;
  nome: string;
  endereco: string;
  categoria: CategoriaLocal;
  facilidades: FacilidadeLocal[];
  aberto24h: boolean;
  horarios: HorarioDiaLocal[];
  fotoFachadaUrl: string;
  fotoAtribuicao: string;
  notaMedia: number;
  totalAvaliacoes: number;
  recomendacoesComboio: number;
};
