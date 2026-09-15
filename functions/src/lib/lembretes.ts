import {CloudTasksClient} from "@google-cloud/tasks";
import {erroDe, log} from "./log";
import type {PayloadLembrete} from "../types/lembrete";

const ANTECEDENCIA_MS = 60 * 60 * 1000; // 1 hora
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? "rolemoto-bc47f";
const LOCATION = "us-central1";
const QUEUE = "lembretes-role";

const client = new CloudTasksClient();
const queuePath = client.queuePath(PROJECT_ID, LOCATION, QUEUE);

const taskName = (roleId: string, userId: string): string =>
  `${queuePath}/tasks/lembrete-${roleId}-${userId}`;

/** URL completa do handler — usada como audience OIDC no createTask e na verificação. */
export const lembretesEnviarUrl = (): string => {
  const base =
    process.env.FUNCTIONS_BASE_URL ??
    `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/api`;
  return `${base.replace(/\/$/, "")}/lembretes/enviar`;
};

/** Calcula se o lembrete ainda faz sentido (> agora). */
const horarioLembreteValido = (dataHoraSaida: string): number | null => {
  const horario = Date.parse(dataHoraSaida) - ANTECEDENCIA_MS;
  if (Number.isNaN(horario) || horario <= Date.now()) {
    return null;
  }
  return horario;
};

export const agendarLembrete = async (
  payload: PayloadLembrete,
  dataHoraSaida: string,
): Promise<void> => {
  const horario = horarioLembreteValido(dataHoraSaida);
  if (!horario) {
    log.info("Lembrete", "Horário inválido, não agendado", {
      roleId: payload.roleId,
      userId: payload.userId,
    });
    return;
  }

  try {
    await client.createTask({
      parent: queuePath,
      task: {
        name: taskName(payload.roleId, payload.userId),
        scheduleTime: {seconds: Math.floor(horario / 1000)},
        httpRequest: {
          httpMethod: "POST",
          url: lembretesEnviarUrl(),
          body: Buffer.from(JSON.stringify(payload)).toString("base64"),
          headers: {"Content-Type": "application/json"},
          oidcToken: {
            serviceAccountEmail: `${PROJECT_ID}@appspot.gserviceaccount.com`,
            audience: lembretesEnviarUrl(),
          },
        },
      },
    });
    log.info("Lembrete", "Task agendada", {
      roleId: payload.roleId,
      userId: payload.userId,
      agendadoPara: new Date(horario).toISOString(),
    });
  } catch (error: unknown) {
    const code = (error as {code?: number}).code;
    // 6 = ALREADY_EXISTS — task já agendada (idempotente)
    if (code === 6) {
      log.info("Lembrete", "Task já existia", {
        roleId: payload.roleId,
        userId: payload.userId,
      });
      return;
    }
    log.error("Lembrete", "Erro ao agendar", {
      roleId: payload.roleId,
      userId: payload.userId,
      ...erroDe(error),
    });
  }
};

export const cancelarLembrete = async (
  roleId: string,
  userId: string,
): Promise<void> => {
  try {
    await client.deleteTask({name: taskName(roleId, userId)});
    log.info("Lembrete", "Task cancelada", {roleId, userId});
  } catch (error: unknown) {
    const code = (error as {code?: number}).code;
    // 5 = NOT_FOUND — task já executada ou inexistente (ok)
    if (code === 5) {
      log.info("Lembrete", "Task não encontrada ao cancelar", {roleId, userId});
      return;
    }
    log.error("Lembrete", "Erro ao cancelar", {roleId, userId, ...erroDe(error)});
  }
};

export const cancelarLembretesDoRole = async (
  roleId: string,
  userIds: string[],
  criadorId: string,
): Promise<void> => {
  const ids = [...new Set([...userIds, criadorId])];
  await Promise.all(ids.map((uid) => cancelarLembrete(roleId, uid)));
};

export const reagendarLembretesDoRole = async (
  roleId: string,
  titulo: string,
  novaDataHoraSaida: string,
  userIds: string[],
  criadorId: string,
): Promise<void> => {
  const ids = [...new Set([...userIds, criadorId])];
  await Promise.all(
    ids.map((uid) =>
      agendarLembrete({roleId, userId: uid, titulo}, novaDataHoraSaida),
    ),
  );
};
