import {idAtividade} from "./atividade";
import {atividadeRepository, roleRepository, usuarioRoleRepository} from "../repositories";
import type {AtividadeCreate} from "../types/atividade";

const HORA_MS = 60 * 60 * 1000;
const DIA_MS = 24 * HORA_MS;
const JANELA_REALIZADO_INICIO_MS = 30 * HORA_MS;
const JANELA_REALIZADO_FIM_MS = 6 * HORA_MS;
const JANELA_CARGA_MS = 30 * DIA_MS;
const PARALELO = 20;

const emLotes = async <T>(itens: T[], fazer: (item: T) => Promise<void>): Promise<void> => {
  for (let i = 0; i < itens.length; i += PARALELO) {
    await Promise.all(itens.slice(i, i + PARALELO).map(fazer));
  }
};

/** Rolê que saiu entre 30 h e 6 h atrás, com ao menos 1 confirmado além do criador. */
export const registrarRolesRealizados = async (agora = new Date()): Promise<{criados: number}> => {
  const roles = await roleRepository.listar({
    dataInicioIso: new Date(agora.getTime() - JANELA_REALIZADO_INICIO_MS).toISOString(),
    dataFimIso: new Date(agora.getTime() - JANELA_REALIZADO_FIM_MS).toISOString(),
  });
  let criados = 0;
  await emLotes(roles, async (role) => {
    if (await usuarioRoleRepository.contarConfirmados(role.id) < 1) return;
    const criou = await atividadeRepository.registrar({
      id: idAtividade("role_realizado", [role.id]),
      tipo: "role_realizado",
      autorId: role.criadorId,
      alvoTipo: "role",
      alvoId: role.id,
      refId: role.id,
      createdAt: agora.toISOString(),
    });
    if (criou) criados += 1;
  });
  return {criados};
};

/** Últimos 30 dias, com a data da origem. Rodar de novo não duplica. */
export const cargaInicialFeed = async (agora = new Date()): Promise<Record<string, number>> => {
  const origens = await atividadeRepository.listarOrigensDesde(
    new Date(agora.getTime() - JANELA_CARGA_MS),
  );
  const contagem: Record<string, number> = {};
  await emLotes<AtividadeCreate>(origens, async (origem) => {
    if (await atividadeRepository.registrar(origem)) {
      contagem[origem.tipo] = (contagem[origem.tipo] ?? 0) + 1;
    }
  });
  return contagem;
};
