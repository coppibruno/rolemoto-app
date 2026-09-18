import {
  coletarIdsRolesHistorico,
  montarHistorico,
  montarHistoricoPublico,
} from "./historico";
import {roleRepository, usuarioRoleRepository} from "../repositories";
import type {Role} from "../types/role";
import type {HistoricoPistas, HistoricoPublico} from "../types/historico-pistas";

const montarMapas = async (uid: string) => {
  const [pedidos, criados] = await Promise.all([
    usuarioRoleRepository.listarPorUsuario(uid),
    roleRepository.listarPorCriador(uid),
  ]);

  const idsPedidos = [...new Set(pedidos.map((pedido) => pedido.roleId))];
  const rolesPedidos = await roleRepository.buscarPorIds(idsPedidos);

  const rolesPorId = new Map<string, Role>();
  for (const role of rolesPedidos) {
    rolesPorId.set(role.id, role);
  }
  for (const criado of criados) {
    rolesPorId.set(criado.id, criado);
  }

  const idsContagem = coletarIdsRolesHistorico(pedidos, criados, rolesPorId);
  const confirmadosPorRole = new Map<string, number>();
  await Promise.all(
    idsContagem.map(async (id) => {
      const n = await usuarioRoleRepository.contarConfirmados(id);
      confirmadosPorRole.set(id, n);
    }),
  );

  return {pedidos, criados, rolesPorId, confirmadosPorRole};
};

export const carregarHistoricoProprio = async (
  uid: string,
): Promise<HistoricoPistas> => {
  const {pedidos, criados, rolesPorId, confirmadosPorRole} =
    await montarMapas(uid);
  return montarHistorico(pedidos, criados, rolesPorId, confirmadosPorRole);
};

export const carregarHistoricoPublico = async (
  uid: string,
): Promise<HistoricoPublico> => {
  const {pedidos, criados, rolesPorId, confirmadosPorRole} =
    await montarMapas(uid);
  return montarHistoricoPublico(
    pedidos,
    criados,
    rolesPorId,
    confirmadosPorRole,
  );
};
