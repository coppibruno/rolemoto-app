import type { AcessoEvento, TipoEvento } from "./evento";
import type { Localizacao } from "./role";

export type SugestaoEvento = {
  id: string;
  urlOrigem: string;
  titulo: string;
  tipoSugerido: TipoEvento;
  local: Localizacao;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  acesso: AcessoEvento;
  informacoes: string;
  fotoCapaUrl: string;
  nota: number;
  motivos: string[];
  cidade: string;
};

export type AprovarSugestaoEvento = {
  titulo: string;
  tipo: TipoEvento;
  acesso: AcessoEvento;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  informacoes: string;
};

export type ResultadoBuscaEventos = {
  lidas: number;
  gravadas: number;
  ignoradas: number;
};
