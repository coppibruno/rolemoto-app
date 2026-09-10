import {adminMessaging} from "./firebase-admin";
import {dispositivoRepository} from "../repositories";

export type TipoPush = "pedido_vaga" | "aceite_vaga";

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
} as const;

const CODIGOS_TOKEN_INVALIDO = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

const origemApp = (): string => {
  const origem = process.env.APP_ORIGIN?.trim();
  if (!origem) {
    return "";
  }
  return origem.replace(/\/$/, "");
};

const enviar = async (uid: string, payload: PayloadPush): Promise<void> => {
  try {
    const tokens = await dispositivoRepository.listarTokensPorUid(uid);
    if (tokens.length === 0) {
      return;
    }

    const origem = origemApp();
    const link = origem ? `${origem}${payload.url}` : undefined;

    const resposta = await adminMessaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        tipo: payload.tipo,
        url: payload.url,
        roleId: payload.roleId,
        title: payload.title,
        body: payload.body,
      },
      ...(link ? {webpush: {fcmOptions: {link}}} : {}),
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
      console.error(resultado.error);
    });

    await Promise.all(
      invalidos.map((token) => dispositivoRepository.removerPorToken(token)),
    );
  } catch (error) {
    console.error(error);
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
