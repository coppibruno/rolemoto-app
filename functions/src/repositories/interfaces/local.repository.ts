import type {Local, LocalCreate} from "../../types/local";

/**
 * Contrato de persistência de locais oficiais.
 * A implementação atual usa Firestore; trocar o adapter não altera as rotas.
 */
export interface LocalRepository {
  criar(dados: LocalCreate): Promise<Local>;
  listar(): Promise<Local[]>;
  buscarPorId(id: string): Promise<Local | null>;
}
