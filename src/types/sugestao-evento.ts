import type { AcessoEvento, TipoEvento } from "./evento";
import type { Localizacao } from "./role";

export type FonteSugestaoEvento = "motoclub" | "instagram";

export type LocalSugestaoEvento = {
  lat: number | null;
  lng: number | null;
  endereco: string;
  nome: string;
};

export type SugestaoEvento = {
  id: string;
  fonte: FonteSugestaoEvento;
  urlOrigem: string;
  titulo: string;
  tipoSugerido: TipoEvento;
  local: LocalSugestaoEvento;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  acesso: AcessoEvento;
  linkIngresso: string | null;
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
  local?: Localizacao;
  linkIngresso?: string | null;
};

export type ResultadoBuscaEventos = {
  lidas: number;
  gravadas: number;
  ignoradas: number;
  instagram?: {
    lidas: number;
    gravadas: number;
    ignoradas: number;
    bloqueada: boolean;
  };
};
