import type {Role, RoleCreate, RoleUpdate, RitmoRole} from "../../types/role";

export type CriteriosListagemRoles = {
  dataInicioIso: string;
  dataFimIso?: string;
  ritmo?: RitmoRole;
};

/**
 * Contrato de persistência de rolês.
 * A implementação atual usa Firestore; trocar o adapter não altera as rotas.
 */
export interface RoleRepository {
  listar(criterios: CriteriosListagemRoles): Promise<Role[]>;
  listarPorCriador(criadorId: string): Promise<Role[]>;
  buscarPorId(id: string): Promise<Role | null>;
  buscarPorIds(ids: string[]): Promise<Role[]>;
  criar(dados: RoleCreate): Promise<Role>;
  atualizar(id: string, dados: RoleUpdate): Promise<Role | null>;
  remover(id: string): Promise<boolean>;
}
