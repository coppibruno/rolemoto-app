import {distanciaRotaKm} from "./geo";
import type {Role} from "../types/role";
import type {UsuarioRole} from "../types/usuario-role";
import type {
  HistoricoPistas,
  ItemHistoricoPista,
  StatusItemHistorico,
} from "../types/historico-pistas";

export const TETO_LISTA_HISTORICO = 50;

export const ePedidoPendente = (pedido: UsuarioRole): boolean =>
  pedido.aceito === false &&
  pedido.aceitoEm === null &&
  pedido.recusadoEm === null;

export const ePedidoAceito = (pedido: UsuarioRole): boolean =>
  pedido.aceito === true &&
  pedido.aceitoEm !== null &&
  pedido.recusadoEm === null;

const saidaPassou = (iso: string): boolean => Date.parse(iso) <= Date.now();

const distanciaKm = (role: Role): number =>
  distanciaRotaKm(role.localSaida, role.destinoFinal);

const ordenarPorSaida = (
  itens: ItemHistoricoPista[],
  direcao: "asc" | "desc",
): ItemHistoricoPista[] => {
  const sinal = direcao === "asc" ? 1 : -1;
  return [...itens].sort(
    (a, b) =>
      sinal * (Date.parse(a.dataHoraSaida) - Date.parse(b.dataHoraSaida)),
  );
};

const paraItem = (
  role: Role,
  status: StatusItemHistorico,
  participantesConfirmados: number,
): ItemHistoricoPista => ({
  roleId: role.id,
  titulo: role.titulo,
  descricao: role.descricao,
  dataHoraSaida: role.dataHoraSaida,
  distanciaKm: distanciaKm(role),
  participantesConfirmados,
  ritmo: role.ritmo,
  status,
});

/** Ids distintos que entram nas três listas (após filtros). */
export const coletarIdsRolesHistorico = (
  pedidos: UsuarioRole[],
  criados: Role[],
  rolesPorId: Map<string, Role>,
): string[] => {
  const ids = new Set<string>();

  for (const pedido of pedidos) {
    const role = rolesPorId.get(pedido.roleId);
    if (!role) {
      continue;
    }
    if (ePedidoPendente(pedido)) {
      if (saidaPassou(role.dataHoraSaida)) {
        continue;
      }
      ids.add(role.id);
    } else if (ePedidoAceito(pedido)) {
      ids.add(role.id);
    }
  }

  for (const criado of criados) {
    ids.add(criado.id);
  }

  return [...ids];
};

export const montarHistorico = (
  pedidos: UsuarioRole[],
  criados: Role[],
  rolesPorId: Map<string, Role>,
  confirmadosPorRole: Map<string, number>,
): HistoricoPistas => {
  const confirmados = (roleId: string): number =>
    confirmadosPorRole.get(roleId) ?? 0;

  const aguardando: ItemHistoricoPista[] = [];
  const participei: ItemHistoricoPista[] = [];

  for (const pedido of pedidos) {
    const role = rolesPorId.get(pedido.roleId);
    if (!role) {
      continue;
    }

    if (ePedidoPendente(pedido)) {
      if (saidaPassou(role.dataHoraSaida)) {
        continue;
      }
      aguardando.push(paraItem(role, "pendente", confirmados(role.id)));
    } else if (ePedidoAceito(pedido)) {
      const status: StatusItemHistorico = saidaPassou(role.dataHoraSaida) ?
        "concluido" :
        "confirmado";
      participei.push(paraItem(role, status, confirmados(role.id)));
    }
  }

  const criadosItens = criados.map((role) =>
    paraItem(role, "lider", confirmados(role.id)),
  );

  const listaAguardando = ordenarPorSaida(aguardando, "asc").slice(
    0,
    TETO_LISTA_HISTORICO,
  );
  const listaParticipei = ordenarPorSaida(participei, "desc").slice(
    0,
    TETO_LISTA_HISTORICO,
  );
  const listaCriados = ordenarPorSaida(criadosItens, "desc").slice(
    0,
    TETO_LISTA_HISTORICO,
  );

  return {
    aguardando: listaAguardando,
    participei: listaParticipei,
    criados: listaCriados,
    contagens: {
      aguardando: listaAguardando.length,
      participei: listaParticipei.length,
      criados: listaCriados.length,
    },
  };
};
