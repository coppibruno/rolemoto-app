import type {Usuario, UsuarioCreate, UsuarioUpdate} from "../../types/usuario";

/**
 * Contrato de persistência de usuários.
 * A implementação atual usa Firestore; trocar o adapter não altera as rotas.
 */
export interface UsuarioRepository {
  buscarPorId(uid: string): Promise<Usuario | null>;
  buscarPorIds(uids: string[]): Promise<Usuario[]>;
  criar(uid: string, dados: UsuarioCreate): Promise<Usuario>;
  atualizar(uid: string, dados: UsuarioUpdate): Promise<Usuario | null>;
  remover(uid: string): Promise<boolean>;
}
