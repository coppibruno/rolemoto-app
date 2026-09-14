import {distanciaRotaKm} from "./geo";
import {ePedidoAceito, ePedidoPendente, ePedidoRecusado} from "./historico";
import type {Role} from "../types/role";
import type {Usuario} from "../types/usuario";
import type {UsuarioRole} from "../types/usuario-role";
import type {
  ContagensMeusRoles,
  CriadorMeuRole,
  DestaqueParticipante,
  MeuRoleItem,
  MeusRolesPayload,
  PapelMeuRole,
  StatusMeuRole,
  TelemetriaMeusRoles,
} from "../types/meus-roles";

export const TETO_MEUS_ROLES = 80;

export type ItemClassificado = {
  role: Role;
  status: StatusMeuRole;
  papel: PapelMeuRole;
  pedidoCriadoEm: string | null;
  recusadoEm: string | null;
};

const saidaPassou = (iso: string): boolean => Date.parse(iso) <= Date.now();

export const iniciaisDe = (nome: string, apelido: string): string => {
  const fonte = nome.trim() || apelido.trim() || "P";
  const tokens = fonte.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }
  const unico = tokens[0];
  if (unico.length >= 2) {
    return unico.slice(0, 2).toUpperCase();
  }
  return `${unico[0]}${unico[0]}`.toUpperCase();
};

export const classificarMeusRoles = (
  uid: string,
  pedidos: UsuarioRole[],
  rolesPorId: Map<string, Role>,
): Map<string, ItemClassificado> => {
  const porId = new Map<string, ItemClassificado>();

  for (const pedido of pedidos) {
    const role = rolesPorId.get(pedido.roleId);
    if (!role || role.criadorId === uid) {
      continue;
    }
    const passou = saidaPassou(role.dataHoraSaida);
    if (ePedidoPendente(pedido) && !passou) {
      porId.set(role.id, {
        role,
        status: "pendente",
        papel: "participante",
        pedidoCriadoEm: pedido.createdAt,
        recusadoEm: null,
      });
    } else if (ePedidoAceito(pedido)) {
      porId.set(role.id, {
        role,
        status: passou ? "concluido" : "confirmado",
        papel: "participante",
        pedidoCriadoEm: pedido.createdAt,
        recusadoEm: null,
      });
    } else if (ePedidoRecusado(pedido)) {
      porId.set(role.id, {
        role,
        status: "recusado",
        papel: "participante",
        pedidoCriadoEm: pedido.createdAt,
        recusadoEm: pedido.recusadoEm,
      });
    }
  }

  return porId;
};

/** Criador vence se existir pedido e publicação do mesmo rolê. */
export const unirComCriados = (
  porId: Map<string, ItemClassificado>,
  criados: Role[],
): ItemClassificado[] => {
  for (const role of criados) {
    const passou = saidaPassou(role.dataHoraSaida);
    porId.set(role.id, {
      role,
      status: passou ? "concluido" : "lider",
      papel: "organizador",
      pedidoCriadoEm: null,
      recusadoEm: null,
    });
  }
  return [...porId.values()];
};

export const montarTelemetria = (
  itens: ItemClassificado[],
): TelemetriaMeusRoles => {
  let ativos = 0;
  let analise = 0;
  let asfaltoKm = 0;
  for (const item of itens) {
    if (item.status === "confirmado" || item.status === "lider") {
      ativos += 1;
    } else if (item.status === "pendente") {
      analise += 1;
    } else if (item.status === "concluido") {
      asfaltoKm += distanciaRotaKm(item.role.localSaida, item.role.destinoFinal);
    }
  }
  return {ativos, analise, asfaltoKm};
};

export const montarContagens = (
  itens: ItemClassificado[],
): ContagensMeusRoles => {
  let confirmados = 0;
  let aguardando = 0;
  let concluidos = 0;
  let recusados = 0;
  for (const item of itens) {
    if (item.status === "confirmado" || item.status === "lider") {
      confirmados += 1;
    } else if (item.status === "pendente") {
      aguardando += 1;
    } else if (item.status === "recusado") {
      recusados += 1;
    } else {
      concluidos += 1;
    }
  }
  return {confirmados, aguardando, concluidos, recusados};
};

export const ordenarPayload = (
  itens: ItemClassificado[],
): ItemClassificado[] =>
  [...itens].sort(
    (a, b) => Date.parse(a.role.dataHoraSaida) - Date.parse(b.role.dataHoraSaida),
  );

const criadorDe = (
  criadorId: string,
  usuario: Usuario | undefined,
): CriadorMeuRole => ({
  uid: criadorId,
  nome: usuario?.nome ?? "",
  apelido: usuario?.apelido || "piloto",
  fotoUrl: usuario?.fotoUrl ?? "",
});

export const destaquesDe = (
  vinculos: UsuarioRole[],
  usuariosPorId: Map<string, Usuario>,
): DestaqueParticipante[] => {
  const destaques: DestaqueParticipante[] = [];
  for (const vinculo of vinculos) {
    const usuario = usuariosPorId.get(vinculo.usuarioId);
    if (!usuario) {
      continue;
    }
    destaques.push({
      fotoUrl: usuario.fotoUrl || "",
      iniciais: iniciaisDe(usuario.nome, usuario.apelido),
    });
  }
  return destaques;
};

export const paraMeuRoleItem = (
  item: ItemClassificado,
  confirmados: number,
  destaques: DestaqueParticipante[],
  usuariosPorId: Map<string, Usuario>,
): MeuRoleItem => {
  const {role} = item;
  return {
    roleId: role.id,
    titulo: role.titulo,
    descricao: role.descricao,
    fotoCapaUrl: role.fotoCapaUrl,
    ritmo: role.ritmo,
    dataHoraSaida: role.dataHoraSaida,
    localSaidaEndereco: role.localSaida.endereco,
    localSaidaNome: role.localSaida.nome ?? "",
    distanciaRotaKm: distanciaRotaKm(role.localSaida, role.destinoFinal),
    status: item.status,
    papel: item.papel,
    criador: criadorDe(role.criadorId, usuariosPorId.get(role.criadorId)),
    participantes: {confirmados, destaques},
    pedidoCriadoEm: item.pedidoCriadoEm,
    recusadoEm: item.recusadoEm,
  };
};

export const montarPayloadMeusRoles = (
  itens: MeuRoleItem[],
  telemetria: TelemetriaMeusRoles,
  contagens: ContagensMeusRoles,
): MeusRolesPayload => ({itens, telemetria, contagens});
