import {
  roleRepository,
  usuarioRepository,
  usuarioRoleRepository,
} from "../repositories";
import type {
  FilaAprovacoes,
  RoleResumoSolicitacao,
  SolicitacaoLider,
  StatusAprovacao,
  UsuarioResumoSolicitacao,
} from "../types/aprovacao";
import type {Role} from "../types/role";
import type {Usuario} from "../types/usuario";
import type {UsuarioRole} from "../types/usuario-role";
import {ePedidoAceito} from "./historico";

const fallbackUsuario = (uid: string): UsuarioResumoSolicitacao => ({
  uid,
  nome: "Piloto",
  apelido: "piloto",
  fotoUrl: "",
  moto: "",
  pilotagem: "moderada",
  cidade: "",
  rolesRodados: 0,
});

const paraUsuarioResumo = (
  usuario: Usuario,
  rolesRodados: number,
): UsuarioResumoSolicitacao => ({
  uid: usuario.uid,
  nome: usuario.nome,
  apelido: usuario.apelido,
  fotoUrl: usuario.fotoUrl,
  moto: usuario.moto,
  pilotagem: usuario.pilotagem,
  cidade: usuario.cidade ?? "",
  rolesRodados,
});

const paraRoleResumo = (
  role: Role,
  confirmados: number,
): RoleResumoSolicitacao => ({
  id: role.id,
  titulo: role.titulo,
  ritmo: role.ritmo,
  dataHoraSaida: role.dataHoraSaida,
  confirmados,
});

export const roleAindaNaoSaiu = (role: Role): boolean =>
  Date.parse(role.dataHoraSaida) > Date.now();

export const jaDecidida = (pedido: UsuarioRole): boolean =>
  pedido.aceito === true ||
  pedido.aceitoEm !== null ||
  pedido.recusadoEm !== null;

const saidaPassou = (iso: string): boolean => Date.parse(iso) <= Date.now();

const contarRolesRodadosPorUids = async (
  uids: string[],
): Promise<Map<string, number>> => {
  const unicos = [...new Set(uids)].filter(Boolean);
  const mapa = new Map<string, number>(unicos.map((uid) => [uid, 0]));
  if (unicos.length === 0) {
    return mapa;
  }

  const pedidosPorUid = await Promise.all(
    unicos.map(async (uid) => ({
      uid,
      pedidos: await usuarioRoleRepository.listarPorUsuario(uid),
    })),
  );

  const aceitos = pedidosPorUid.flatMap(({uid, pedidos}) =>
    pedidos.filter(ePedidoAceito).map((p) => ({uid, roleId: p.roleId})),
  );
  if (aceitos.length === 0) {
    return mapa;
  }

  const roles = await roleRepository.buscarPorIds([
    ...new Set(aceitos.map((a) => a.roleId)),
  ]);
  const concluidos = new Set(
    roles.filter((role) => saidaPassou(role.dataHoraSaida)).map((role) => role.id),
  );

  for (const {uid, roleId} of aceitos) {
    if (concluidos.has(roleId)) {
      mapa.set(uid, (mapa.get(uid) ?? 0) + 1);
    }
  }
  return mapa;
};

const montarItem = (
  participacao: UsuarioRole,
  role: Role,
  usuario: Usuario | undefined,
  confirmados: number,
  rolesRodados: number,
): SolicitacaoLider => {
  const resumoUsuario = usuario ?
    paraUsuarioResumo(usuario, rolesRodados) :
    fallbackUsuario(participacao.usuarioId);
  return {
    id: participacao.id,
    participacao,
    usuario: resumoUsuario,
    role: paraRoleResumo(role, confirmados),
    divergenciaRitmo: resumoUsuario.pilotagem !== role.ritmo,
  };
};

export const montarSolicitacaoLider = async (
  participacao: UsuarioRole,
): Promise<SolicitacaoLider | null> => {
  const [usuario, role, rolesRodadosPorUid] = await Promise.all([
    usuarioRepository.buscarPorId(participacao.usuarioId),
    roleRepository.buscarPorId(participacao.roleId),
    contarRolesRodadosPorUids([participacao.usuarioId]),
  ]);
  if (!role) {
    return null;
  }
  const confirmados = await usuarioRoleRepository.contarConfirmados(role.id);
  return montarItem(
    participacao,
    role,
    usuario ?? undefined,
    confirmados,
    rolesRodadosPorUid.get(participacao.usuarioId) ?? 0,
  );
};

export const montarFilaAprovacoes = async (
  criadorId: string,
  status: StatusAprovacao,
): Promise<FilaAprovacoes> => {
  const [pendentes, aceitos] = await Promise.all([
    usuarioRoleRepository.listarPendentesDoCriador(criadorId),
    usuarioRoleRepository.listarAceitosDoCriador(criadorId),
  ]);

  const todos = [...pendentes, ...aceitos];
  const [roles, usuarios] = await Promise.all([
    roleRepository.buscarPorIds([...new Set(todos.map((p) => p.roleId))]),
    usuarioRepository.buscarPorIds([...new Set(todos.map((p) => p.usuarioId))]),
  ]);

  const rolesAtivos = new Map(
    roles.filter(roleAindaNaoSaiu).map((role) => [role.id, role]),
  );
  const usuariosMap = new Map(usuarios.map((usuario) => [usuario.uid, usuario]));

  const pendentesAtivos = pendentes.filter((p) => rolesAtivos.has(p.roleId));
  const aceitosAtivos = aceitos.filter((p) => rolesAtivos.has(p.roleId));
  const visao = status === "pendente" ? pendentesAtivos : aceitosAtivos;

  const confirmadosPorRole = new Map<string, number>();
  const roleIdsVisao = [...new Set(visao.map((p) => p.roleId))];
  const uidsVisao = [...new Set(visao.map((p) => p.usuarioId))];
  const [, rolesRodadosPorUid] = await Promise.all([
    Promise.all(
      roleIdsVisao.map(async (roleId) => {
        confirmadosPorRole.set(
          roleId,
          await usuarioRoleRepository.contarConfirmados(roleId),
        );
      }),
    ),
    contarRolesRodadosPorUids(uidsVisao),
  ]);

  const itens: SolicitacaoLider[] = [];
  for (const participacao of visao) {
    const role = rolesAtivos.get(participacao.roleId);
    if (!role) {
      continue;
    }
    itens.push(
      montarItem(
        participacao,
        role,
        usuariosMap.get(participacao.usuarioId),
        confirmadosPorRole.get(role.id) ?? 0,
        rolesRodadosPorUid.get(participacao.usuarioId) ?? 0,
      ),
    );
  }

  return {
    resumo: {
      pendentes: pendentesAtivos.length,
      aceitos: aceitosAtivos.length,
      rolesComPendentes: new Set(pendentesAtivos.map((p) => p.roleId)).size,
      rolesComAceitos: new Set(aceitosAtivos.map((p) => p.roleId)).size,
    },
    itens,
  };
};
