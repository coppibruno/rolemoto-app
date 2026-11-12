import type {
  OfertaLocal,
  OfertaLocalDados,
  ResultadoAtualizarOferta,
  ResultadoCriarOferta,
} from "../../types/oferta-local";

/**
 * Contrato de persistência das ofertas de um local (`ofertaslocal`).
 * Teto por local e código único são checados na mesma transação da escrita.
 */
export interface OfertaLocalRepository {
  /** `updatedAt` desc. */
  listarPorLocal(localId: string): Promise<OfertaLocal[]>;
  listarAtivas(): Promise<OfertaLocal[]>;
  buscarPorId(id: string): Promise<OfertaLocal | null>;
  criar(localId: string, dados: OfertaLocalDados, teto: number): Promise<ResultadoCriarOferta>;
  atualizar(
    id: string,
    localId: string,
    dados: OfertaLocalDados & {ativa: boolean},
  ): Promise<ResultadoAtualizarOferta>;
  definirAtiva(id: string, ativa: boolean): Promise<OfertaLocal | null>;
  remover(id: string): Promise<void>;
  pausarPorLocal(localId: string): Promise<void>;
  removerPorLocal(localId: string): Promise<number>;
}
