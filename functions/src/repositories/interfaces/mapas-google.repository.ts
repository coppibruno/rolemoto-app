import type {
  MarcoMapaGoogle,
  ProvedorMapa,
} from "../../lib/mapas-google/cota";

export type ReservaMapaGoogle = {
  provedor: ProvedorMapa;
  marco: MarcoMapaGoogle;
  periodo: string;
  cargas: number;
};

export interface MapasGoogleRepository {
  /**
   * Reserva uma carga do mês corrente (America/Sao_Paulo).
   * No teto devolve osm sem incrementar.
   */
  reservar(): Promise<ReservaMapaGoogle>;
}
