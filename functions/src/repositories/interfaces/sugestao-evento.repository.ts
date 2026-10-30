import type {Evento} from "../../types/evento";
import type {
  AprovarSugestaoEvento,
  StatusSugestaoEvento,
  SugestaoEvento,
  SugestaoEventoNova,
} from "../../types/sugestao-evento";

export interface SugestaoEventoRepository {
  listarPorStatus(status: StatusSugestaoEvento): Promise<SugestaoEvento[]>;
  listarIds(): Promise<string[]>;
  buscarPorId(id: string): Promise<SugestaoEvento | null>;
  /** `false` quando o id já estava na fila. */
  criar(dados: SugestaoEventoNova): Promise<boolean>;
  aprovar(id: string, dados: AprovarSugestaoEvento): Promise<Evento>;
  recusar(id: string): Promise<void>;
}
