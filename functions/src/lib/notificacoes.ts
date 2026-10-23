import type {BatchResponse, MulticastMessage} from "firebase-admin/messaging";
import { adminMessaging } from "./firebase-admin";
import { dispositivoRepository } from "../repositories";
import { origemApp } from "./origem";
import { erroDe, log } from "./log";
import type { PlataformaDispositivo } from "../types/dispositivo";
import type {
  AlvoLembrete,
  AntecedenciaLembrete,
  PayloadLembrete,
} from "../types/lembrete";

export type TipoPush =
  | "pedido_vaga"
  | "aceite_vaga"
  | "lembrete_role"
  | "lembrete_evento"
  | "cancelamento_role"
  | "story_local";

type PayloadPush = {
  tipo: TipoPush;
  title: string;
  body: string;
  url: string;
  roleId: string;
  localId: string;
  eventoId: string;
};

const COPY = {
  pedido_vaga: "Um motociclista solicitou vaga para um rolê",
  aceite_vaga: "O organizador aceitou você no rolê",
} as const;

/** Título do lembrete. 24 h = “amanhã”; 2 h diz as horas. Sem o aviso de 1 h. */
export const tituloLembrete = (
  alvo: AlvoLembrete,
  antecedencia: AntecedenciaLembrete,
): string => {
  if (alvo === "evento") {
    return antecedencia === "24h" ?
      "Tem evento amanhã" :
      "Seu evento começa em 2 horas";
  }
  return antecedencia === "24h" ?
    "Seu rolê é amanhã" :
    "Seu rolê começa em 2 horas";
};

const CANAL_NATIVO = "rolemoto_push";

const CODIGOS_TOKEN_INVALIDO = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

/** Resultado do envio — DELETE/cancelamento audita sem falhar o domínio. */
export type ResultadoPush = {
  uid: string;
  tokens: number;
  sucesso: number;
  falha: number;
  erros: string[];
  ignoradoEmulator: boolean;
};

const resultadoVazio = (
  uid: string,
  parcial: Partial<ResultadoPush> = {},
): ResultadoPush => ({
  uid,
  tokens: 0,
  sucesso: 0,
  falha: 0,
  erros: [],
  ignoradoEmulator: false,
  ...parcial,
});

const ehNativo = (plataforma: PlataformaDispositivo): boolean =>
  plataforma === "android" || plataforma === "ios";

type ContextoPush = {
  uid: string;
  tipo: TipoPush;
  roleId: string;
  plataforma: "web" | "nativo";
};

const processarResposta = async (
  tokens: string[],
  resposta: BatchResponse,
  contexto: ContextoPush,
): Promise<{sucesso: number; falha: number; erros: string[]}> => {
  const invalidos: string[] = [];
  const erros: string[] = [];
  resposta.responses.forEach((resultado, indice) => {
    if (resultado.success) {
      return;
    }
    const codigo = resultado.error?.code ?? "desconhecido";
    erros.push(codigo);
    if (CODIGOS_TOKEN_INVALIDO.has(codigo)) {
      invalidos.push(tokens[indice]);
      log.warn("Push", "Token inválido removido", {
        ...contexto,
        codigo,
      });
      return;
    }
    log.warn("Push", "Falha FCM em token", {
      ...contexto,
      codigo,
      mensagem: resultado.error?.message,
    });
  });

  if (invalidos.length > 0) {
    log.warn("Push", "Removendo tokens inválidos", {
      ...contexto,
      removidos: invalidos.length,
    });
  }

  await Promise.all(
    invalidos.map((token) => dispositivoRepository.removerPorToken(token)),
  );

  log.info("Push", "Envio concluído", {
    ...contexto,
    sucesso: resposta.successCount,
    falha: resposta.failureCount,
    tokensRemovidos: invalidos.length,
  });

  return {
    sucesso: resposta.successCount,
    falha: resposta.failureCount,
    erros,
  };
};

const mensagemWeb = (
  tokens: string[],
  payload: PayloadPush,
  icon: string,
): MulticastMessage => ({
  tokens,
  data: {
    tipo: payload.tipo,
    url: payload.url,
    roleId: payload.roleId,
    localId: payload.localId,
    eventoId: payload.eventoId,
    title: payload.title,
    body: payload.body,
    icon,
  },
  webpush: {
    headers: {
      Urgency: "high",
      TTL: "86400",
    },
  },
});

const mensagemNativa = (
  tokens: string[],
  payload: PayloadPush,
): MulticastMessage => ({
  tokens,
  notification: {
    title: payload.title,
    body: payload.body,
  },
  data: {
    tipo: payload.tipo,
    url: payload.url,
    roleId: payload.roleId,
    localId: payload.localId,
    eventoId: payload.eventoId,
    title: payload.title,
    body: payload.body,
  },
  android: {
    priority: "high",
    notification: {
      channelId: CANAL_NATIVO,
    },
  },
  apns: {
    payload: {
      aps: {
        sound: "default",
      },
    },
  },
});

const enviar = async (
  uid: string,
  payload: PayloadPush,
): Promise<ResultadoPush> => {
  const contexto = {
    uid,
    tipo: payload.tipo,
    roleId: payload.roleId,
  };

  try {
    const dispositivos = await dispositivoRepository.listarPorUid(uid);
    if (dispositivos.length === 0) {
      log.warn("Push", "0 tokens FCM — push não enviado", contexto);
      return resultadoVazio(uid);
    }

    // Emulator aponta ao FCM de produção — lista tokens p/ diagnóstico, sem disparar.
    if (process.env.FUNCTIONS_EMULATOR === "true") {
      log.info("Push", "Ignorado no emulator", {
        ...contexto,
        tokens: dispositivos.length,
      });
      return resultadoVazio(uid, {
        tokens: dispositivos.length,
        ignoradoEmulator: true,
      });
    }

    const webTokens = dispositivos
      .filter((item) => item.plataforma === "web")
      .map((item) => item.token);
    const nativoTokens = dispositivos
      .filter((item) => ehNativo(item.plataforma))
      .map((item) => item.token);

    log.info("Push", "Iniciando envio", {
      ...contexto,
      tokens: dispositivos.length,
      web: webTokens.length,
      nativo: nativoTokens.length,
    });

    const origem = origemApp();
    const icon = origem ? `${origem}/icons/icon-192.png` : "";

    const parciais: Array<{sucesso: number; falha: number; erros: string[]}> = [];

    if (webTokens.length > 0) {
      const ctxWeb: ContextoPush = {...contexto, plataforma: "web"};
      // Só `data`: com `webpush.notification` o Chrome engole o push se o PWA
      // estiver aberto em segundo plano (nem SW nem onMessage desenham o card).
      const resposta = await adminMessaging.sendEachForMulticast(
        mensagemWeb(webTokens, payload, icon),
      );
      parciais.push(await processarResposta(webTokens, resposta, ctxWeb));
    }

    if (nativoTokens.length > 0) {
      const ctxNativo: ContextoPush = {...contexto, plataforma: "nativo"};
      const resposta = await adminMessaging.sendEachForMulticast(
        mensagemNativa(nativoTokens, payload),
      );
      parciais.push(await processarResposta(nativoTokens, resposta, ctxNativo));
    }

    const agregado = parciais.reduce(
      (acc, item) => ({
        sucesso: acc.sucesso + item.sucesso,
        falha: acc.falha + item.falha,
        erros: acc.erros.concat(item.erros),
      }),
      {sucesso: 0, falha: 0, erros: [] as string[]},
    );

    return {
      uid,
      tokens: dispositivos.length,
      sucesso: agregado.sucesso,
      falha: agregado.falha,
      erros: agregado.erros,
      ignoradoEmulator: false,
    };
  } catch (error) {
    log.error("Push", "Erro ao enviar", {...contexto, ...erroDe(error)});
    return resultadoVazio(uid, {
      falha: 1,
      erros: [error instanceof Error ? error.message : "erro_desconhecido"],
    });
  }
};

export const notificarPedidoVaga = async (
  criadorId: string,
  roleId: string,
  titulo: string,
): Promise<ResultadoPush> => {
  return enviar(criadorId, {
    tipo: "pedido_vaga",
    title: COPY.pedido_vaga,
    body: titulo,
    url: "/aprovacoes",
    roleId,
    localId: "",
    eventoId: "",
  });
};

export const notificarAceite = async (
  usuarioId: string,
  roleId: string,
  titulo: string,
): Promise<ResultadoPush> => {
  return enviar(usuarioId, {
    tipo: "aceite_vaga",
    title: COPY.aceite_vaga,
    body: titulo,
    url: `/roles/${roleId}/participar`,
    roleId,
    localId: "",
    eventoId: "",
  });
};

export const notificarLembrete = async (
  payload: PayloadLembrete,
  titulo: string,
): Promise<ResultadoPush> => {
  const evento = payload.alvo === "evento";
  return enviar(payload.userId, {
    tipo: evento ? "lembrete_evento" : "lembrete_role",
    title: tituloLembrete(payload.alvo, payload.antecedencia),
    body: titulo,
    url: evento ?
      `/eventos/${payload.alvoId}` :
      `/roles/${payload.alvoId}/participar`,
    roleId: evento ? "" : payload.alvoId,
    localId: "",
    eventoId: evento ? payload.alvoId : "",
  });
};

/** Push aos confirmados — não filtra `usersrole.notificar` (aceite implica interesse). */
export const notificarCancelamentoRole = async (
  usuarioId: string,
  roleId: string,
  titulo: string,
): Promise<ResultadoPush> => {
  return enviar(usuarioId, {
    tipo: "cancelamento_role",
    title: "Rolê cancelado",
    body: `${titulo} foi cancelado pelo organizador.`,
    url: "/meus-roles",
    roleId,
    localId: "",
    eventoId: "",
  });
};

const LOTE_PUSH = 8;
const LOTE_PUSH_LARGO = 20;

const emLote = async (
  uids: string[],
  tamanho: number,
  enviarUm: (uid: string) => Promise<void>,
): Promise<void> => {
  for (let i = 0; i < uids.length; i += tamanho) {
    const lote = uids.slice(i, i + tamanho);
    await Promise.all(lote.map(async (uid) => {
      try {
        await enviarUm(uid);
      } catch (error) {
        log.warn("Push", "Falha em um destinatário", {uid, ...erroDe(error)});
      }
    }));
  }
};

/** Um envio por uid. Falha de um não aborta os outros nem o POST da story. */
export const notificarStory = async (
  uids: string[],
  title: string,
  body: string,
  url: string,
  refs: {localId: string; eventoId: string},
  lote = LOTE_PUSH,
): Promise<void> => {
  await emLote(uids, lote, async (uid) => {
    await enviar(uid, {
      tipo: "story_local",
      title,
      body,
      url,
      roleId: "",
      localId: refs.localId,
      eventoId: refs.eventoId,
    });
  });
};

/** Mesmo texto para cada uid. Usado no aviso de 24 h do evento. */
export const notificarLembretes = async (
  uids: string[],
  base: PayloadLembrete,
  titulo: string,
): Promise<void> => {
  await emLote(uids, LOTE_PUSH_LARGO, async (userId) => {
    await notificarLembrete({...base, userId, audiencia: "pessoa"}, titulo);
  });
};
