import {
  usuarioEventoRepository,
  usuarioRepository,
  usuarioRoleRepository,
} from "../repositories";
import type {Usuario} from "../types/usuario";
import type {
  ParticipanteResumo,
  ParticipantesBloco,
  ParticipantesLista,
} from "../types/participante";
import {
  LIMITE_DESTAQUES_FEED,
  LIMITE_LISTA_PARTICIPANTES,
} from "../types/participante";
import {iniciaisDe} from "./meus-roles";

const resumoDe = (usuario: Usuario): ParticipanteResumo => ({
  uid: usuario.uid,
  apelido: usuario.apelido || "piloto",
  fotoUrl: usuario.fotoUrl || "",
  iniciais: iniciaisDe(usuario.nome, usuario.apelido),
  moto: usuario.moto || "",
});

const hidratar = async (uids: string[]): Promise<ParticipanteResumo[]> => {
  if (uids.length === 0) {
    return [];
  }
  const usuarios = await usuarioRepository.buscarPorIds(uids);
  const porId = new Map(usuarios.map((u) => [u.uid, u]));
  const itens: ParticipanteResumo[] = [];
  for (const uid of uids) {
    const usuario = porId.get(uid);
    if (!usuario) {
      continue;
    }
    itens.push(resumoDe(usuario));
  }
  return itens;
};

export const blocoParticipantesRole = async (
  roleId: string,
  limiteDestaques = LIMITE_DESTAQUES_FEED,
): Promise<ParticipantesBloco> => {
  const [total, vinculos] = await Promise.all([
    usuarioRoleRepository.contarConfirmados(roleId),
    usuarioRoleRepository.listarConfirmadosDoRole(roleId, limiteDestaques),
  ]);
  const destaques = await hidratar(vinculos.map((v) => v.usuarioId));
  return {total, destaques};
};

export const blocoParticipantesEvento = async (
  eventoId: string,
  limiteDestaques = LIMITE_DESTAQUES_FEED,
): Promise<ParticipantesBloco> => {
  const [total, vinculos] = await Promise.all([
    usuarioEventoRepository.contarPorEvento(eventoId),
    usuarioEventoRepository.listarDestaquesDoEvento(eventoId, limiteDestaques),
  ]);
  const destaques = await hidratar(vinculos.map((v) => v.usuarioId));
  return {total, destaques};
};

export const enriquecerParticipantesRoles = async (
  roleIds: string[],
): Promise<Map<string, ParticipantesBloco>> => {
  const mapa = new Map<string, ParticipantesBloco>();
  const unicos = [...new Set(roleIds)].filter(Boolean);
  await Promise.all(
    unicos.map(async (id) => {
      mapa.set(id, await blocoParticipantesRole(id));
    }),
  );
  return mapa;
};

export const enriquecerParticipantesEventos = async (
  eventoIds: string[],
): Promise<Map<string, ParticipantesBloco>> => {
  const mapa = new Map<string, ParticipantesBloco>();
  const unicos = [...new Set(eventoIds)].filter(Boolean);
  await Promise.all(
    unicos.map(async (id) => {
      mapa.set(id, await blocoParticipantesEvento(id));
    }),
  );
  return mapa;
};

export const listarParticipantesRole = async (
  roleId: string,
): Promise<ParticipantesLista> => {
  const [total, vinculos] = await Promise.all([
    usuarioRoleRepository.contarConfirmados(roleId),
    usuarioRoleRepository.listarConfirmadosDoRole(
      roleId,
      LIMITE_LISTA_PARTICIPANTES,
    ),
  ]);
  const itens = await hidratar(vinculos.map((v) => v.usuarioId));
  return {total, itens};
};

export const listarParticipantesEvento = async (
  eventoId: string,
): Promise<ParticipantesLista> => {
  const [total, vinculos] = await Promise.all([
    usuarioEventoRepository.contarPorEvento(eventoId),
    usuarioEventoRepository.listarPorEvento(eventoId),
  ]);
  const uids = vinculos
    .slice(0, LIMITE_LISTA_PARTICIPANTES)
    .map((v) => v.usuarioId);
  const itens = await hidratar(uids);
  return {total, itens};
};

export const blocoVazio = (): ParticipantesBloco => ({
  total: 0,
  destaques: [],
});
