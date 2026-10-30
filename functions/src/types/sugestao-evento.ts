import type {AcessoEvento, TipoEvento} from "./evento";
import type {Localizacao} from "./role";

export type StatusSugestaoEvento = "pendente" | "aprovada" | "recusada";

export type FonteSugestaoEvento = "motoclub";

export interface SugestaoEvento {
  id: string;
  fonte: FonteSugestaoEvento;
  slug: string;
  urlOrigem: string;
  titulo: string;
  tipoSugerido: TipoEvento;
  local: Localizacao;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  acesso: AcessoEvento;
  linkIngresso: string | null;
  informacoes: string;
  fotoCapaUrl: string;
  nota: number;
  motivos: string[];
  cidade: string;
  status: StatusSugestaoEvento;
  eventoId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SugestaoEventoNova = Omit<
  SugestaoEvento,
  "status" | "eventoId" | "createdAt" | "updatedAt"
>;

export type AprovarSugestaoEvento = {
  titulo: string;
  tipo: TipoEvento;
  acesso: AcessoEvento;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  informacoes: string;
  linkIngresso: string | null;
  fotoCapaUrl: string;
  local: Localizacao;
  criadorId: string;
};
