import { adminMessaging } from "./firebase-admin";
import { dispositivoRepository } from "../repositories";
import { origemApp } from "./origem";
import { erroDe, log } from "./log";

export type TipoPush =
  | "pedido_vaga"
  | "aceite_vaga"
  | "lembrete_role"
  | "cancelamento_role";

type PayloadPush = {
  tipo: TipoPush;
  title: string;
  body: string;
  url: string;
  roleId: string;
};

const COPY = {
  pedido_vaga: "Um motociclista solicitou vaga para um rolê",
  aceite_vaga: "O organizador aceitou você no rolê",
  lembrete_role: "Seu rolê começa em 1 hora! 🏍️",
} as const;

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
    const tokens = await dispositivoRepository.listarTokensPorUid(uid);
    if (tokens.length === 0) {
      log.warn("Push", "0 tokens FCM — push não enviado", contexto);
      return resultadoVazio(uid);
    }

    // Emulator aponta ao FCM de produção — lista tokens p/ diagnóstico, sem disparar.
    if (process.env.FUNCTIONS_EMULATOR === "true") {
      log.info("Push", "Ignorado no emulator", {
        ...contexto,
        tokens: tokens.length,
      });
      return resultadoVazio(uid, {
        tokens: tokens.length,
        ignoradoEmulator: true,
      });
    }

    log.info("Push", "Iniciando envio", {
      ...contexto,
      tokens: tokens.length,
    });

    const origem = origemApp();
    const icon = origem ? `${origem}/icons/icon-192.png` : "";

    // Só `data`: com `webpush.notification` o Chrome engole o push se o PWA
    // estiver aberto em segundo plano (nem SW nem onMessage desenham o card).
    const resposta = await adminMessaging.sendEachForMulticast({
      tokens,
      data: {
        tipo: payload.tipo,
        url: payload.url,
        roleId: payload.roleId,
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
      uid,
      tokens: tokens.length,
      sucesso: resposta.successCount,
      falha: resposta.failureCount,
      erros,
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
  });
};

export const notificarLembrete = async (
  userId: string,
  roleId: string,
  titulo: string,
): Promise<ResultadoPush> => {
  return enviar(userId, {
    tipo: "lembrete_role",
    title: COPY.lembrete_role,
    body: titulo,
    url: `/roles/${roleId}/participar`,
    roleId,
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
  });
};
