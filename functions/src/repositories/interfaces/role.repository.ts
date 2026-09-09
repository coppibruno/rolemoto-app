import type {Role, RoleCreate, RoleUpdate} from "../../types/role";

/**
 * Contrato de persistência de rolês.
 * A implementação atual usa Firestore; trocar o adapter não altera as rotas.
 */
export interface RoleRepository {
  listar(): Promise<Role[]>;
  buscarPorId(id: string): Promise<Role | null>;
  criar(dados: RoleCreate): Promise<Role>;
  atualizar(id: string, dados: RoleUpdate): Promise<Role | null>;
  remover(id: string): Promise<boolean>;
}
