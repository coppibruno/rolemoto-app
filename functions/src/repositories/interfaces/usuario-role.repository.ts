import type {
  UsuarioRole,
  UsuarioRoleCreate,
  UsuarioRoleDecisao,
  UsuarioRoleNotificar,
} from "../../types/usuario-role";

/**
 * Contrato de persistência do vínculo usuário ↔ rolê (`usersrole`).
 */
export interface UsuarioRoleRepository {
  buscarPorId(id: string): Promise<UsuarioRole | null>;
  buscarPorUsuarioERole(
    usuarioId: string,
    roleId: string,
  ): Promise<UsuarioRole | null>;
  listarPendentesDoCriador(criadorId: string): Promise<UsuarioRole[]>;
  listarAceitosDoCriador(criadorId: string): Promise<UsuarioRole[]>;
  contarPendentesDoCriador(criadorId: string): Promise<number>;
  contarAceitosDoCriador(criadorId: string): Promise<number>;
  contarConfirmados(roleId: string): Promise<number>;
  listarConfirmadosDoRole(
    roleId: string,
    limite: number,
  ): Promise<UsuarioRole[]>;
  listarPorUsuario(usuarioId: string): Promise<UsuarioRole[]>;
  criar(dados: UsuarioRoleCreate): Promise<UsuarioRole>;
  atualizarNotificar(
    id: string,
    dados: UsuarioRoleNotificar,
  ): Promise<UsuarioRole | null>;
  decidir(id: string, dados: UsuarioRoleDecisao): Promise<UsuarioRole | null>;
  remover(id: string): Promise<boolean>;
}
