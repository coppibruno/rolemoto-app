import {CloudTasksClient} from "@google-cloud/tasks";
import {erroDe, log} from "./log";
import type {
  AlvoLembrete,
  AntecedenciaLembrete,
  AudienciaLembrete,
  PayloadLembrete,
} from "../types/lembrete";

const ANTECEDENCIAS: {chave: AntecedenciaLembrete; ms: number}[] = [
  {chave: "24h", ms: 24 * 60 * 60 * 1000},
  {chave: "2h", ms: 2 * 60 * 60 * 1000},
];
/** O handler só envia se o relógio estiver perto de início − antecedência. */
const JANELA_DISPARO_MS = 20 * 60 * 1000;
/** Cloud Tasks recusa scheduleTime a mais de 720h (30 dias). */
const LIMITE_AGENDA_MS = 29 * 24 * 60 * 60 * 1000;
const TZ_SP = "America/Sao_Paulo";
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? "rolemoto-bc47f";
const LOCATION = "us-central1";
const QUEUE = "lembretes-role";

const formatarSp = (ms: number): string =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ_SP,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(ms))
    .replace(" ", "T");

const client = new CloudTasksClient();
const queuePath = client.queuePath(PROJECT_ID, LOCATION, QUEUE);

const msDa = (antecedencia: AntecedenciaLembrete): number =>
  antecedencia === "24h" ? ANTECEDENCIAS[0].ms : ANTECEDENCIAS[1].ms;

const taskName = (
  alvo: AlvoLembrete,
  alvoId: string,
  userId: string,
  antecedencia: AntecedenciaLembrete,
  horarioSegundos: number,
): string =>
  `${queuePath}/tasks/` +
  `lembrete-${antecedencia}-${alvo}-${alvoId}-${userId}-${horarioSegundos}`;

/** Id da SPEC 020 (`lembrete-{roleId}-{userId}`), ainda pode estar na fila. */
const taskNameLegado = (roleId: string, userId: string): string =>
  `${queuePath}/tasks/lembrete-${roleId}-${userId}`;

/** URL completa do handler — audience OIDC no createTask e na verificação. */
export const lembretesEnviarUrl = (): string => {
  const base =
    process.env.FUNCTIONS_BASE_URL ??
    `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/api`;
  return `${base.replace(/\/$/, "")}/lembretes/enviar`;
};

/**
 * true quando `agora` está a até 20 min de (início − antecedência).
 * Task atrasada ou de um horário que já foi editado não dispara.
 */
export const lembreteNaJanela = (
  inicioIso: string,
  antecedencia: AntecedenciaLembrete,
  agora = Date.now(),
): boolean => {
  const inicio = Date.parse(inicioIso);
  if (Number.isNaN(inicio)) {
    return false;
  }
  const esperado = inicio - msDa(antecedencia);
  return Math.abs(agora - esperado) <= JANELA_DISPARO_MS;
};

type HorarioAgenda =
  | {ok: true; horario: number}
  | {ok: false; motivo: "instante_invalido" | "passou" | "alem_30_dias"};

const horarioAgenda = (
  instanteIso: string,
  antecedencia: AntecedenciaLembrete,
): HorarioAgenda => {
  const inicio = Date.parse(instanteIso);
  if (Number.isNaN(inicio)) {
    return {ok: false, motivo: "instante_invalido"};
  }
  const horario = inicio - msDa(antecedencia);
  if (horario <= Date.now()) {
    return {ok: false, motivo: "passou"};
  }
  if (horario - Date.now() > LIMITE_AGENDA_MS) {
    return {ok: false, motivo: "alem_30_dias"};
  }
  return {ok: true, horario};
};

/** Segundos do disparo, mesmo se já passou — o cancelamento usa o mesmo id. */
const segundosAgenda = (
  instanteIso: string,
  antecedencia: AntecedenciaLembrete,
): number | null => {
  const inicio = Date.parse(instanteIso);
  if (Number.isNaN(inicio)) {
    return null;
  }
  return Math.floor((inicio - msDa(antecedencia)) / 1000);
};

const agendarUma = async (
  alvo: AlvoLembrete,
  alvoId: string,
  userId: string,
  titulo: string,
  instanteIso: string,
  antecedencia: AntecedenciaLembrete,
  audiencia: AudienciaLembrete = "pessoa",
): Promise<void> => {
  const calculado = horarioAgenda(instanteIso, antecedencia);
  if (!calculado.ok) {
    log.info("Lembrete", "Antecedência não agendada", {
      alvo,
      alvoId,
      userId,
      antecedencia,
      motivo: calculado.motivo,
      instanteIso,
    });
    return;
  }

  const payload: PayloadLembrete = {
    alvo,
    alvoId,
    userId,
    titulo,
    antecedencia,
    audiencia,
  };
  const nomeNaTask = audiencia === "todos" ? "todos" : userId;

  try {
    await client.createTask({
      parent: queuePath,
      task: {
        name: taskName(
          alvo,
          alvoId,
          nomeNaTask,
          antecedencia,
          Math.floor(calculado.horario / 1000),
        ),
        scheduleTime: {seconds: Math.floor(calculado.horario / 1000)},
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
      alvo,
      alvoId,
      userId,
      antecedencia,
      instanteIso,
      agendadoParaSp: formatarSp(calculado.horario),
    });
  } catch (error: unknown) {
    const code = (error as {code?: number}).code;
    // 6 = ALREADY_EXISTS — task já agendada (idempotente)
    if (code === 6) {
      log.info("Lembrete", "Task já existia", {
        alvo,
        alvoId,
        userId,
        antecedencia,
      });
      return;
    }
    log.error("Lembrete", "Erro ao agendar", {
      alvo,
      alvoId,
      userId,
      antecedencia,
      ...erroDe(error),
    });
  }
};

const agendarPar = async (
  alvo: AlvoLembrete,
  alvoId: string,
  userId: string,
  titulo: string,
  instanteIso: string,
): Promise<void> => {
  await Promise.all(
    ANTECEDENCIAS.map((item) =>
      agendarUma(alvo, alvoId, userId, titulo, instanteIso, item.chave),
    ),
  );
};

/** 24 h e 2 h antes da saída, para organizador ou piloto aceito. */
export const agendarLembrete = async (
  payload: {roleId: string; userId: string; titulo: string},
  dataHoraSaida: string,
): Promise<void> => {
  await agendarPar(
    "role",
    payload.roleId,
    payload.userId,
    payload.titulo,
    dataHoraSaida,
  );
};

/** 2 h antes da abertura, só para criador ou inscrito. */
export const agendarLembreteEvento = async (
  payload: {eventoId: string; userId: string; titulo: string},
  dataHoraAbertura: string,
): Promise<void> => {
  await agendarUma(
    "evento",
    payload.eventoId,
    payload.userId,
    payload.titulo,
    dataHoraAbertura,
    "2h",
  );
};

/** Uma task, 24 h antes. Na hora, avisa quem tiver token — com ou sem inscrição. */
export const agendarAvisoEvento = async (
  payload: {eventoId: string; titulo: string},
  dataHoraAbertura: string,
): Promise<void> => {
  await agendarUma(
    "evento",
    payload.eventoId,
    "",
    payload.titulo,
    dataHoraAbertura,
    "24h",
    "todos",
  );
};

const apagarTask = async (
  name: string,
  ctx: {alvo: string; alvoId: string; userId: string; qual: string},
): Promise<void> => {
  try {
    await client.deleteTask({name});
    log.info("Lembrete", "Task cancelada", ctx);
  } catch (error: unknown) {
    const code = (error as {code?: number}).code;
    // 5 = NOT_FOUND — task já executada ou inexistente (ok)
    if (code === 5) {
      log.info("Lembrete", "Task não encontrada ao cancelar", ctx);
      return;
    }
    log.error("Lembrete", "Erro ao cancelar", {...ctx, ...erroDe(error)});
  }
};

const nomesParaCancelar = (
  alvo: AlvoLembrete,
  alvoId: string,
  userId: string,
  instanteIso: string,
): {name: string; qual: string}[] => {
  const atuais: {name: string; qual: string}[] = [];
  ANTECEDENCIAS.forEach((item) => {
    const segundos = segundosAgenda(instanteIso, item.chave);
    if (segundos === null) {
      return;
    }
    atuais.push({
      name: taskName(alvo, alvoId, userId, item.chave, segundos),
      qual: item.chave,
    });
  });
  if (alvo === "role") {
    atuais.push({name: taskNameLegado(alvoId, userId), qual: "1h"});
  }
  return atuais;
};

export const cancelarLembrete = async (
  roleId: string,
  userId: string,
  dataHoraSaida: string,
): Promise<void> => {
  const nomes = nomesParaCancelar("role", roleId, userId, dataHoraSaida);
  await Promise.all(
    nomes.map((item) =>
      apagarTask(item.name, {
        alvo: "role",
        alvoId: roleId,
        userId,
        qual: item.qual,
      }),
    ),
  );
};

export const cancelarLembreteEvento = async (
  eventoId: string,
  userId: string,
  dataHoraAbertura: string,
): Promise<void> => {
  const nomes = nomesParaCancelar("evento", eventoId, userId, dataHoraAbertura);
  await Promise.all(
    nomes.map((item) =>
      apagarTask(item.name, {
        alvo: "evento",
        alvoId: eventoId,
        userId,
        qual: item.qual,
      }),
    ),
  );
};

export const cancelarLembretesDoRole = async (
  roleId: string,
  userIds: string[],
  criadorId: string,
  dataHoraSaida: string,
): Promise<void> => {
  const ids = [...new Set([...userIds, criadorId])];
  await Promise.all(
    ids.map((uid) => cancelarLembrete(roleId, uid, dataHoraSaida)),
  );
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

type LeituraLembrete =
  | {ok: true; payload: PayloadLembrete}
  | {ok: false; motivo: string};

/** Task da SPEC 020 não tem `antecedencia` — o handler consome sem enviar. */
export const lerPayloadLembrete = (body: unknown): LeituraLembrete => {
  const bruto = body && typeof body === "object" ?
    body as Record<string, unknown> :
    {};
  const antecedencia = bruto.antecedencia;
  const userId = typeof bruto.userId === "string" ? bruto.userId : "";
  if (antecedencia !== "24h" && antecedencia !== "2h") {
    const legado = typeof bruto.roleId === "string" && bruto.roleId.length > 0;
    return {
      ok: false,
      motivo: legado ?
        "lembrete de 1 hora descontinuado" :
        "payload inválido",
    };
  }
  const alvo = bruto.alvo;
  const alvoId = typeof bruto.alvoId === "string" ? bruto.alvoId : "";
  const titulo = typeof bruto.titulo === "string" ? bruto.titulo : "";
  const audiencia = bruto.audiencia === "todos" ? "todos" : "pessoa";
  if ((alvo !== "role" && alvo !== "evento") || !alvoId) {
    return {ok: false, motivo: "payload inválido"};
  }
  if (audiencia === "todos" && (alvo !== "evento" || antecedencia !== "24h")) {
    return {ok: false, motivo: "payload inválido"};
  }
  if (audiencia === "pessoa" && !userId) {
    return {ok: false, motivo: "payload inválido"};
  }
  return {
    ok: true,
    payload: {alvo, alvoId, userId, titulo, antecedencia, audiencia},
  };
};
