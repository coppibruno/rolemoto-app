import {
  InstagramBloqueadoError,
  InstagramRedeError,
  RenovacaoTokenError,
} from "./erros";

/** Abaixo deste prazo a rodada pede outro token, se a semente ainda vale. */
export const MARGEM_RENOVACAO_MS = 14 * 24 * 60 * 60 * 1000;

const DIA_MS = 24 * 60 * 60 * 1000;

export const TOKEN_EXPIRADO =
  "Sessão do Instagram expirada. Gere um token de usuário no app da Meta " +
  "e atualize INSTAGRAM_ACCESS_TOKEN uma vez. Com INSTAGRAM_APP_ID e " +
  "INSTAGRAM_APP_SECRET a rodada renova esse token antes dos 60 dias.";

export type InspecaoToken = {
  valido: boolean;
  /** `null` quando a Meta diz que não vence (`expires_at` 0). */
  expiresAtMs: number | null;
};

export type DecisaoToken = "usar" | "renovar" | "expirado";

export type TokenInstagramGuardado = {
  accessToken: string;
  expiresAtMs: number | null;
  /** Valor de `INSTAGRAM_ACCESS_TOKEN` na última troca aceita. */
  semente: string;
};

export type TokenRenovado = {
  accessToken: string;
  expiresAtMs: number;
};

export type ClienteTokenInstagram = {
  inspecionar: (token: string) => Promise<InspecaoToken>;
  renovar: (
    token: string,
    expiraEmMs: number | null,
    agora: number,
  ) => Promise<TokenRenovado>;
};

export type AvisoToken = "sem-credenciais" | "renovacao-falhou";

export type ResultadoTokenInstagram = {
  accessToken: string;
  renovou: boolean;
  expiraEmMs: number | null;
  aviso: AvisoToken | null;
  detalhe?: string;
};

export const decidirRenovacao = (
  info: InspecaoToken,
  agora: number,
): DecisaoToken => {
  if (!info.valido) {
    return "expirado";
  }
  if (info.expiresAtMs == null) {
    return "usar";
  }
  if (info.expiresAtMs <= agora) {
    return "expirado";
  }
  if (info.expiresAtMs - agora <= MARGEM_RENOVACAO_MS) {
    return "renovar";
  }
  return "usar";
};

export const estendeuPrazo = (
  antesMs: number | null,
  depoisMs: number,
  agora: number,
): boolean => depoisMs >= (antesMs ?? agora) + DIA_MS;

const numero = (valor: unknown): number | null =>
  typeof valor === "number" && Number.isFinite(valor) ? valor : null;

export const inspecaoDe = (corpo: unknown): InspecaoToken | null => {
  if (!corpo || typeof corpo !== "object") {
    return null;
  }
  const data = (corpo as {data?: unknown}).data;
  if (!data || typeof data !== "object") {
    return null;
  }
  const item = data as {is_valid?: unknown; expires_at?: unknown};
  if (typeof item.is_valid !== "boolean") {
    return null;
  }
  if (!item.is_valid) {
    return {valido: false, expiresAtMs: null};
  }
  const expiresAt = numero(item.expires_at);
  if (expiresAt == null || expiresAt <= 0) {
    return {valido: true, expiresAtMs: null};
  }
  return {valido: true, expiresAtMs: expiresAt * 1000};
};

export const tokenTrocadoDe = (
  corpo: unknown,
  agora: number,
): TokenRenovado | null => {
  if (!corpo || typeof corpo !== "object") {
    return null;
  }
  const item = corpo as {access_token?: unknown; expires_in?: unknown};
  const accessToken = typeof item.access_token === "string" ?
    item.access_token.trim() :
    "";
  if (accessToken.length < 20) {
    return null;
  }
  const expiresIn = numero(item.expires_in);
  const segundos = expiresIn != null && expiresIn > 0 ?
    expiresIn :
    60 * DIA_MS / 1000;
  return {accessToken, expiresAtMs: agora + segundos * 1000};
};

export const codigoClienteDe = (corpo: unknown): string | null => {
  if (!corpo || typeof corpo !== "object") {
    return null;
  }
  const code = (corpo as {code?: unknown}).code;
  if (typeof code !== "string") {
    return null;
  }
  const limpo = code.trim();
  return limpo.length >= 8 ? limpo : null;
};

export const semSegredo = (texto: string): string =>
  texto
    .replace(/EAA[A-Za-z0-9]+/g, "[token]")
    .replace(/access_token=[^&\s]+/gi, "access_token=[token]")
    .replace(/client_secret=[^&\s]+/gi, "client_secret=[segredo]")
    .replace(/fb_exchange_token=[^&\s]+/gi, "fb_exchange_token=[token]")
    .slice(0, 180);

const prazoDe = (info: InspecaoToken): number =>
  info.expiresAtMs == null ? Number.POSITIVE_INFINITY : info.expiresAtMs;

const maisLongo = (
  candidatos: {accessToken: string; info: InspecaoToken}[],
): {accessToken: string; info: InspecaoToken} | null => {
  let melhor: {accessToken: string; info: InspecaoToken} | null = null;
  for (const candidato of candidatos) {
    if (!melhor || prazoDe(candidato.info) > prazoDe(melhor.info)) {
      melhor = candidato;
    }
  }
  return melhor;
};

const igual = (
  guardado: TokenInstagramGuardado | null,
  proximo: TokenInstagramGuardado,
): boolean =>
  guardado != null &&
  guardado.accessToken === proximo.accessToken &&
  guardado.expiresAtMs === proximo.expiresAtMs &&
  guardado.semente === proximo.semente;

/**
 * Escolhe o token vigente. A env nova ganha da cópia guardada.
 * Com a mesma semente, fica o prazo mais longo. A Meta não renova sessão vencida.
 */
export const resolverTokenInstagram = async (entrada: {
  envToken: string;
  guardado: TokenInstagramGuardado | null;
  agora: number;
  cliente: ClienteTokenInstagram | null;
  salvar: (token: TokenInstagramGuardado) => Promise<void>;
}): Promise<ResultadoTokenInstagram> => {
  const env = entrada.envToken.trim();
  const guardado = entrada.guardado;
  if (!entrada.cliente) {
    const accessToken = env || guardado?.accessToken || "";
    if (!accessToken) {
      throw new InstagramBloqueadoError("Token do Instagram ausente");
    }
    const mesmaCopia = guardado?.accessToken === accessToken;
    return {
      accessToken,
      renovou: false,
      expiraEmMs: mesmaCopia ? guardado.expiresAtMs : null,
      aviso: "sem-credenciais",
    };
  }

  if (!env && !guardado?.accessToken) {
    throw new InstagramBloqueadoError("Token do Instagram ausente");
  }

  const sementeNova = env.length > 0 && env !== (guardado?.semente ?? "");
  if (
    !sementeNova &&
    guardado &&
    guardado.accessToken &&
    guardado.expiresAtMs != null &&
    decidirRenovacao(
      {valido: true, expiresAtMs: guardado.expiresAtMs},
      entrada.agora,
    ) === "usar"
  ) {
    return {
      accessToken: guardado.accessToken,
      renovou: false,
      expiraEmMs: guardado.expiresAtMs,
      aviso: null,
    };
  }

  const infoEnv = env ? await entrada.cliente.inspecionar(env) : null;

  let escolhido: {accessToken: string; info: InspecaoToken} | null = null;
  if (sementeNova && infoEnv?.valido) {
    escolhido = {accessToken: env, info: infoEnv};
  } else {
    const candidatos: {accessToken: string; info: InspecaoToken}[] = [];
    if (env && infoEnv?.valido) {
      candidatos.push({accessToken: env, info: infoEnv});
    }
    if (guardado?.accessToken && guardado.accessToken !== env) {
      const infoGuardado = await entrada.cliente.inspecionar(guardado.accessToken);
      if (infoGuardado.valido) {
        candidatos.push({
          accessToken: guardado.accessToken,
          info: infoGuardado,
        });
      }
    }
    escolhido = maisLongo(candidatos);
  }

  if (!escolhido) {
    throw new InstagramBloqueadoError(TOKEN_EXPIRADO);
  }

  const semente = sementeNova && infoEnv?.valido ? env : (guardado?.semente || env);
  const proximo: TokenInstagramGuardado = {
    accessToken: escolhido.accessToken,
    expiresAtMs: escolhido.info.expiresAtMs,
    semente,
  };
  if (decidirRenovacao(escolhido.info, entrada.agora) === "usar") {
    if (!igual(guardado, proximo)) {
      await entrada.salvar(proximo);
    }
    return {
      accessToken: proximo.accessToken,
      renovou: false,
      expiraEmMs: proximo.expiresAtMs,
      aviso: null,
    };
  }

  try {
    const novo = await entrada.cliente.renovar(
      escolhido.accessToken,
      escolhido.info.expiresAtMs,
      entrada.agora,
    );
    if (!estendeuPrazo(
      escolhido.info.expiresAtMs,
      novo.expiresAtMs,
      entrada.agora,
    )) {
      throw new RenovacaoTokenError("A Meta não estendeu o prazo do token");
    }
    const gravado: TokenInstagramGuardado = {
      accessToken: novo.accessToken,
      expiresAtMs: novo.expiresAtMs,
      semente,
    };
    await entrada.salvar(gravado);
    return {
      accessToken: gravado.accessToken,
      renovou: true,
      expiraEmMs: gravado.expiresAtMs,
      aviso: null,
    };
  } catch (error) {
    if (error instanceof InstagramRedeError) {
      throw error;
    }
    if (error instanceof InstagramBloqueadoError) {
      throw error;
    }
    const resta = (escolhido.info.expiresAtMs ?? 0) - entrada.agora;
    if (resta > 0) {
      const detalhe = error instanceof Error ? semSegredo(error.message) : "";
      return {
        accessToken: escolhido.accessToken,
        renovou: false,
        expiraEmMs: escolhido.info.expiresAtMs,
        aviso: "renovacao-falhou",
        detalhe,
      };
    }
    throw new InstagramBloqueadoError(TOKEN_EXPIRADO);
  }
};
