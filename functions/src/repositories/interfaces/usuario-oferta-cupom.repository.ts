import type {UsuarioOfertaCupomCreate} from "../../types/oferta-local";

/**
 * Abertura do cupom (`usersofertacupom`): um doc por piloto, oferta e dia.
 */
export interface UsuarioOfertaCupomRepository {
  /** `novo: false` quando o doc do dia já existia. */
  abrir(dados: UsuarioOfertaCupomCreate): Promise<{novo: boolean}>;
  contarPorLocalDesde(localId: string, desde: Date): Promise<number>;
}
