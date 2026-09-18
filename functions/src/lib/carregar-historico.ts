import {
  coletarIdsRolesHistorico,
  montarHistorico,
  montarHistoricoPublico,
  paraItemEvento,
} from "./historico";
import {
  eventoRepository,
  roleRepository,
  usuarioEventoFeedbackRepository,
  usuarioEventoRepository,
  usuarioRoleRepository,
} from "../repositories";
import type {Role} from "../types/role";
import type {
  HistoricoPistas,
  HistoricoPublico,
  ItemHistoricoEvento,
} from "../types/historico-pistas";

const idFeedbackEvento = (usuarioId: string, eventoId: string): string =>
  `${usuarioId}_${eventoId}`;

const carregarItensEvento = async (
  uid: string,
): Promise<ItemHistoricoEvento[]> => {
  const inscricoes = await usuarioEventoRepository.listarPorUsuario(uid);
  if (inscricoes.length === 0) {
    return [];
  }

  const idsEvento = [...new Set(inscricoes.map((i) => i.eventoId))];
  const [eventos, inscritosPorEvento, feedbacks] = await Promise.all([
    eventoRepository.buscarPorIds(idsEvento),
    usuarioEventoRepository.contarPorEventos(idsEvento),
    usuarioEventoFeedbackRepository.buscarPorIds(
      idsEvento.map((eventoId) => idFeedbackEvento(uid, eventoId)),
    ),
  ]);
  const avaliados = new Set(feedbacks.map((doc) => doc.eventoId));

  return eventos.map((evento) =>
    paraItemEvento(
      evento,
      inscritosPorEvento.get(evento.id) ?? 0,
      avaliados.has(evento.id),
    ),
  );
};

const montarMapas = async (uid: string) => {
  const [pedidos, criados, itensEvento] = await Promise.all([
    usuarioRoleRepository.listarPorUsuario(uid),
    roleRepository.listarPorCriador(uid),
    carregarItensEvento(uid),
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

  return {pedidos, criados, rolesPorId, confirmadosPorRole, itensEvento};
};

export const carregarHistoricoProprio = async (
  uid: string,
): Promise<HistoricoPistas> => {
  const {pedidos, criados, rolesPorId, confirmadosPorRole, itensEvento} =
    await montarMapas(uid);
  return montarHistorico(
    pedidos,
    criados,
    rolesPorId,
    confirmadosPorRole,
    itensEvento,
  );
};

export const carregarHistoricoPublico = async (
  uid: string,
): Promise<HistoricoPublico> => {
  const {pedidos, criados, rolesPorId, confirmadosPorRole, itensEvento} =
    await montarMapas(uid);
  return montarHistoricoPublico(
    pedidos,
    criados,
    rolesPorId,
    confirmadosPorRole,
    itensEvento,
  );
};
