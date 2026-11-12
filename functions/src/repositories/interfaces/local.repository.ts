import type {Local, LocalCreate} from "../../types/local";

/**
 * Contrato de persistência de locais oficiais.
 * A implementação atual usa Firestore; trocar o adapter não altera as rotas.
 */
export interface LocalRepository {
  criar(dados: LocalCreate): Promise<Local>;
  listar(): Promise<Local[]>;
  buscarPorId(id: string): Promise<Local | null>;
  buscarPorIds(ids: string[]): Promise<Local[]>;
  /** `true` quando esta chamada gravou o dia e deve disparar o push. */
  reservarPushDoDia(id: string, ymd: string): Promise<boolean>;
  /** `donoId` é interno: não entra em `Local`. Documento antigo sem o campo vale `null`. */
  buscarComDono(id: string): Promise<{local: Local; donoId: string | null} | null>;
  definirDono(id: string, donoId: string | null): Promise<void>;
  /** Ordem por nome. */
  listarPorDono(donoId: string): Promise<{id: string; nome: string}[]>;
  remover(id: string): Promise<void>;
}
