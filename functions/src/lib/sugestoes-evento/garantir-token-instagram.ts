import {tokenInstagramRepository} from "../../repositories";
import {erroDe, log} from "../log";
import {InstagramRedeError, RenovacaoTokenError} from "./erros";
import {
  codigoClienteDe,
  estendeuPrazo,
  inspecaoDe,
  resolverTokenInstagram,
  semSegredo,
  tokenTrocadoDe,
  type ClienteTokenInstagram,
  type InspecaoToken,
  type TokenRenovado,
} from "./renovacao-token-instagram";

const VERSAO = "v27.0";
const HOST = "https://graph.facebook.com";
const TIMEOUT_MS = 25000;

const mensagemDe = (corpo: unknown): string => {
  if (!corpo || typeof corpo !== "object") {
    return "";
  }
  const erro = (corpo as {error?: {message?: unknown}}).error;
  return typeof erro?.message === "string" ? erro.message : "";
};

const pedir = async (url: string): Promise<unknown> => {
  let resposta: Response;
  try {
    resposta = await fetch(url, {signal: AbortSignal.timeout(TIMEOUT_MS)});
  } catch {
    throw new InstagramRedeError();
  }
  const corpo: unknown = await resposta.json().catch(() => null);
  if (resposta.status >= 500 || resposta.status === 429) {
    throw new InstagramRedeError();
  }
  if (corpo && typeof corpo === "object" && "error" in corpo) {
    const mensagem = semSegredo(mensagemDe(corpo) || "A Meta recusou o token");
    throw new RenovacaoTokenError(mensagem);
  }
  if (!resposta.ok) {
    throw new RenovacaoTokenError("A Meta recusou a renovação do token");
  }
  return corpo;
};

const inspecionarToken = async (
  token: string,
  appId: string,
  appSecret: string,
): Promise<InspecaoToken> => {
  const url = new URL(`${HOST}/${VERSAO}/debug_token`);
  url.searchParams.set("input_token", token);
  url.searchParams.set("access_token", `${appId}|${appSecret}`);
  try {
    const corpo = await pedir(url.toString());
    const info = inspecaoDe(corpo);
    if (!info) {
      throw new InstagramRedeError();
    }
    return info;
  } catch (error) {
    if (error instanceof RenovacaoTokenError) {
      return {valido: false, expiresAtMs: null};
    }
    throw error;
  }
};

const trocarPorLongo = async (
  token: string,
  appId: string,
  appSecret: string,
  agora: number,
): Promise<TokenRenovado | null> => {
  const url = new URL(`${HOST}/${VERSAO}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", token);
  const corpo = await pedir(url.toString());
  return tokenTrocadoDe(corpo, agora);
};

const renovarPorCodigo = async (
  token: string,
  appId: string,
  appSecret: string,
  redirectUri: string,
  agora: number,
): Promise<TokenRenovado | null> => {
  const codigoUrl = new URL(`${HOST}/${VERSAO}/oauth/client_code`);
  codigoUrl.searchParams.set("client_id", appId);
  codigoUrl.searchParams.set("client_secret", appSecret);
  codigoUrl.searchParams.set("redirect_uri", redirectUri);
  codigoUrl.searchParams.set("access_token", token);
  const codigo = codigoClienteDe(await pedir(codigoUrl.toString()));
  if (!codigo) {
    throw new RenovacaoTokenError("A Meta não devolveu o código de renovação");
  }
  const trocaUrl = new URL(`${HOST}/${VERSAO}/oauth/access_token`);
  trocaUrl.searchParams.set("client_id", appId);
  trocaUrl.searchParams.set("redirect_uri", redirectUri);
  trocaUrl.searchParams.set("code", codigo);
  return tokenTrocadoDe(await pedir(trocaUrl.toString()), agora);
};

const clienteMeta = (
  appId: string,
  appSecret: string,
  redirectUri: string,
): ClienteTokenInstagram => ({
  inspecionar: (token) => inspecionarToken(token, appId, appSecret),
  renovar: async (token, expiraEmMs, agora) => {
    let troca: TokenRenovado | null = null;
    let falhaTroca: RenovacaoTokenError | null = null;
    try {
      troca = await trocarPorLongo(token, appId, appSecret, agora);
    } catch (error) {
      if (!(error instanceof RenovacaoTokenError)) {
        throw error;
      }
      falhaTroca = error;
    }
    if (troca && estendeuPrazo(expiraEmMs, troca.expiresAtMs, agora)) {
      return troca;
    }
    if (!redirectUri) {
      throw falhaTroca ?? new RenovacaoTokenError(
        "A Meta não estendeu o token. Defina INSTAGRAM_OAUTH_REDIRECT_URI.",
      );
    }
    try {
      const porCodigo = await renovarPorCodigo(
        token,
        appId,
        appSecret,
        redirectUri,
        agora,
      );
      if (porCodigo && estendeuPrazo(expiraEmMs, porCodigo.expiresAtMs, agora)) {
        return porCodigo;
      }
    } catch (error) {
      if (!(error instanceof RenovacaoTokenError)) {
        throw error;
      }
      falhaTroca = error;
    }
    throw falhaTroca ?? new RenovacaoTokenError(
      "A Meta não estendeu o prazo do token",
    );
  },
});

/** Token vigente. A env é a semente; o prazo renovado fica em `config/instagram`. */
export const garantirTokenInstagram = async (): Promise<string> => {
  const envToken = (process.env.INSTAGRAM_ACCESS_TOKEN ?? "").trim();
  const appId = (process.env.INSTAGRAM_APP_ID ?? "").trim();
  const appSecret = (process.env.INSTAGRAM_APP_SECRET ?? "").trim();
  const redirectUri = (process.env.INSTAGRAM_OAUTH_REDIRECT_URI ?? "").trim();
  const guardado = await tokenInstagramRepository.ler().catch((error: unknown) => {
    log.warn("SugestaoEvento", "Token do Instagram não foi lido", erroDe(error));
    return null;
  });
  const cliente = appId && appSecret ?
    clienteMeta(appId, appSecret, redirectUri) :
    null;
  const resultado = await resolverTokenInstagram({
    envToken,
    guardado,
    agora: Date.now(),
    cliente,
    salvar: async (token) => {
      try {
        await tokenInstagramRepository.salvar(token);
      } catch (error) {
        log.warn(
          "SugestaoEvento",
          "Token do Instagram não foi gravado",
          erroDe(error),
        );
      }
    },
  });
  if (resultado.aviso === "sem-credenciais") {
    log.info("SugestaoEvento", "Renovação do Instagram desligada", {
      motivo: "sem INSTAGRAM_APP_ID ou INSTAGRAM_APP_SECRET",
    });
  } else if (resultado.aviso === "renovacao-falhou") {
    log.warn("SugestaoEvento", "Renovação do Instagram falhou", {
      expiraEm: resultado.expiraEmMs ?
        new Date(resultado.expiraEmMs).toISOString() :
        null,
      detalhe: resultado.detalhe ?? "",
    });
  } else if (resultado.renovou) {
    log.info("SugestaoEvento", "Token do Instagram renovado", {
      expiraEm: resultado.expiraEmMs ?
        new Date(resultado.expiraEmMs).toISOString() :
        null,
    });
  }
  return resultado.accessToken;
};
