import {distanciaRotaKm} from "./geo";
import type {Evento} from "../types/evento";
import type {Role} from "../types/role";
import type {UsuarioRole} from "../types/usuario-role";
import type {
  HistoricoPistas,
  HistoricoPublico,
  ItemHistoricoEvento,
  ItemHistoricoPista,
  ItemHistoricoRole,
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

export const ePedidoRecusado = (pedido: UsuarioRole): boolean =>
  pedido.recusadoEm !== null;

const saidaPassou = (iso: string): boolean => Date.parse(iso) <= Date.now();

const eventoEncerrou = (evento: Evento): boolean => {
  const limite = evento.dataHoraEncerramento ?? evento.dataHoraAbertura;
  return Date.parse(limite) <= Date.now();
};

const distanciaKm = (role: Role): number =>
  distanciaRotaKm(role.localSaida, role.destinoFinal);

const dataDoItem = (item: ItemHistoricoPista): number => {
  if (item.tipo === "evento") {
    return Date.parse(item.dataHoraAbertura);
  }
  return Date.parse(item.dataHoraSaida);
};

const ordenarPorData = (
  itens: ItemHistoricoPista[],
  direcao: "asc" | "desc",
): ItemHistoricoPista[] => {
  const sinal = direcao === "asc" ? 1 : -1;
  return [...itens].sort((a, b) => sinal * (dataDoItem(a) - dataDoItem(b)));
};

const ordenarRolesPorSaida = (
  itens: ItemHistoricoRole[],
  direcao: "asc" | "desc",
): ItemHistoricoRole[] => {
  const sinal = direcao === "asc" ? 1 : -1;
  return [...itens].sort(
    (a, b) =>
      sinal * (Date.parse(a.dataHoraSaida) - Date.parse(b.dataHoraSaida)),
  );
};

const paraItemRole = (
  role: Role,
  status: StatusItemHistorico,
  participantesConfirmados: number,
): ItemHistoricoRole => ({
  tipo: "role",
  roleId: role.id,
  titulo: role.titulo,
  descricao: role.descricao,
  dataHoraSaida: role.dataHoraSaida,
  distanciaKm: distanciaKm(role),
  participantesConfirmados,
  ritmo: role.ritmo,
  status,
});

export const paraItemEvento = (
  evento: Evento,
  inscritosConfirmados: number,
  avaliado = false,
): ItemHistoricoEvento => {
  const localNome =
    evento.local.nome.trim() || evento.local.endereco.trim() || "Local";
  return {
    tipo: "evento",
    eventoId: evento.id,
    titulo: evento.titulo,
    dataHoraAbertura: evento.dataHoraAbertura,
    localNome,
    acesso: evento.acesso,
    inscritosConfirmados,
    status: eventoEncerrou(evento) ? "concluido" : "confirmado",
    avaliado,
  };
};

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
  itensEvento: ItemHistoricoEvento[] = [],
): HistoricoPistas => {
  const confirmados = (roleId: string): number =>
    confirmadosPorRole.get(roleId) ?? 0;

  const aguardando: ItemHistoricoRole[] = [];
  const participeiRoles: ItemHistoricoRole[] = [];

  for (const pedido of pedidos) {
    const role = rolesPorId.get(pedido.roleId);
    if (!role) {
      continue;
    }

    if (ePedidoPendente(pedido)) {
      if (saidaPassou(role.dataHoraSaida)) {
        continue;
      }
      aguardando.push(paraItemRole(role, "pendente", confirmados(role.id)));
    } else if (ePedidoAceito(pedido)) {
      const status: StatusItemHistorico = saidaPassou(role.dataHoraSaida) ?
        "concluido" :
        "confirmado";
      participeiRoles.push(
        paraItemRole(role, status, confirmados(role.id)),
      );
    }
  }

  const criadosItens = criados.map((role) =>
    paraItemRole(role, "lider", confirmados(role.id)),
  );

  const listaAguardando = ordenarRolesPorSaida(aguardando, "asc").slice(
    0,
    TETO_LISTA_HISTORICO,
  );
  const listaParticipei = ordenarPorData(
    [...participeiRoles, ...itensEvento],
    "desc",
  ).slice(0, TETO_LISTA_HISTORICO);
  const listaCriados = ordenarRolesPorSaida(criadosItens, "desc").slice(
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

/** Visão pública: sem pedidos pendentes (aba Aguardando). */
export const montarHistoricoPublico = (
  pedidos: UsuarioRole[],
  criados: Role[],
  rolesPorId: Map<string, Role>,
  confirmadosPorRole: Map<string, number>,
  itensEvento: ItemHistoricoEvento[] = [],
): HistoricoPublico => {
  const proprio = montarHistorico(
    pedidos,
    criados,
    rolesPorId,
    confirmadosPorRole,
    itensEvento,
  );
  return {
    concluidos: proprio.participei,
    comoLider: proprio.criados,
    contagens: {
      concluidos: proprio.contagens.participei,
      comoLider: proprio.contagens.criados,
    },
  };
};
