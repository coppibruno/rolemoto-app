import type {Evento, EventoCreate} from "../../types/evento";

export type FiltroListagemEventos = {
  dataInicioIso: string;
  dataFimIso?: string;
};

/**
 * Contrato de persistência de eventos.
 * A implementação atual usa Firestore; trocar o adapter não altera as rotas.
 */
export interface EventoRepository {
  criar(dados: EventoCreate): Promise<Evento>;
  listarFuturos(filtros?: FiltroListagemEventos): Promise<Evento[]>;
  buscarPorId(id: string): Promise<Evento | null>;
}
