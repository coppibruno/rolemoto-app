import { adminMessaging } from "./firebase-admin";
import { dispositivoRepository } from "../repositories";
import { origemApp } from "./origem";
import { erroDe, log } from "./log";

export type TipoPush = "pedido_vaga" | "aceite_vaga" | "lembrete_role";

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

const enviar = async (uid: string, payload: PayloadPush): Promise<void> => {
  const contexto = {
    uid,
    tipo: payload.tipo,
    roleId: payload.roleId,
  };

  try {
    const tokens = await dispositivoRepository.listarTokensPorUid(uid);
    if (tokens.length === 0) {
      log.warn("Push", "Usuário sem tokens FCM", contexto);
      return;
    }

    log.info("Push", "Iniciando envio", {
      ...contexto,
      tokens: tokens.length,
    });

    const origem = origemApp();
    const link = origem ? `${origem}${payload.url}` : undefined;

    const resposta = await adminMessaging.sendEachForMulticast({
      tokens,
      data: {
        tipo: payload.tipo,
        url: payload.url,
        roleId: payload.roleId,
        title: payload.title,
        body: payload.body,
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: "/icons/icon-192.png",
          data: {
            url: payload.url,
            tipo: payload.tipo,
            roleId: payload.roleId,
          },
        },
        fcmOptions: link ? { link } : {},
      },
    });

    const invalidos: string[] = [];
    resposta.responses.forEach((resultado, indice) => {
      if (resultado.success) {
        return;
      }
      const codigo = resultado.error?.code ?? "";
      if (CODIGOS_TOKEN_INVALIDO.has(codigo)) {
        invalidos.push(tokens[indice]);
        return;
      }
      log.error("Push", "Falha em token", {
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
  } catch (error) {
    log.error("Push", "Erro ao enviar", {...contexto, ...erroDe(error)});
  }
};

export const notificarPedidoVaga = async (
  criadorId: string,
  roleId: string,
  titulo: string,
): Promise<void> => {
  await enviar(criadorId, {
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
): Promise<void> => {
  await enviar(usuarioId, {
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
): Promise<void> => {
  await enviar(userId, {
    tipo: "lembrete_role",
    title: COPY.lembrete_role,
    body: titulo,
    url: `/roles/${roleId}/participar`,
    roleId,
  });
};
