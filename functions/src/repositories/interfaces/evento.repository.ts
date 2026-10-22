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
  buscarPorIds(ids: string[]): Promise<Evento[]>;
  /** Abertura mais recente primeiro. O filtro “ao vivo” fica na aplicação. */
  listarPorLocalId(localId: string, limite: number): Promise<Evento[]>;
  atualizarLocalId(id: string, localId: string | null): Promise<Evento | null>;
  /** `true` quando esta chamada gravou o dia e deve disparar o push. */
  reservarPushDoDia(id: string, ymd: string): Promise<boolean>;
}
