import {erroDe, log} from "../log";
import {
  InstagramBloqueadoError,
  InstagramRedeError,
} from "./erros";

const VERSAO = "v27.0";
const HOST = "https://graph.facebook.com";
const TIMEOUT_MS = 25000;
const PAGINAS = 3;
/** Com 50 por página a Meta demora ~20 s e responde 500 "reduce the amount of data". */
const LIMITE_PAGINA = 25;
const LIMITE_REDUZIDO = 10;
const HASHTAGS_EM_PARALELO = 3;

export const emLotes = async <T, R>(
  itens: readonly T[],
  limite: number,
  tarefa: (item: T) => Promise<R>,
): Promise<R[]> => {
  const saida: R[] = new Array(itens.length);
  let cursor = 0;
  const workers = Array.from(
    {length: Math.min(limite, itens.length)},
    async () => {
      while (cursor < itens.length) {
        const indice = cursor;
        cursor += 1;
        saida[indice] = await tarefa(itens[indice]);
      }
    },
  );
  await Promise.all(workers);
  return saida;
};
const JANELA_MS = 24 * 60 * 60 * 1000;
const CODIGOS_BLOQUEIO = new Set([10, 102, 104, 190, 200]);

export type MidiaInstagram = {
  id: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl: string;
  permalink: string;
  timestamp: string;
};

const codigoDe = (corpo: unknown): number | null => {
  if (!corpo || typeof corpo !== "object") {
    return null;
  }
  const erro = (corpo as {error?: {code?: unknown}}).error;
  const codigo = erro?.code;
  return typeof codigo === "number" ? codigo : null;
};

const mensagemDe = (corpo: unknown): string => {
  if (!corpo || typeof corpo !== "object") {
    return "";
  }
  const erro = (corpo as {error?: {message?: unknown}}).error;
  return typeof erro?.message === "string" ? erro.message : "";
};

const ehBloqueio = (status: number, corpo: unknown): boolean => {
  const codigo = codigoDe(corpo);
  if (codigo != null && CODIGOS_BLOQUEIO.has(codigo)) {
    return true;
  }
  const msg = mensagemDe(corpo).toLowerCase();
  if (
    msg.includes("permission") ||
    msg.includes("public content") ||
    msg.includes("access token") ||
    msg.includes("not authorized")
  ) {
    return true;
  }
  return status === 401 || status === 403;
};

class PedidoGrandeError extends Error {
  constructor() {
    super("Instagram pediu menos itens por página");
    this.name = "PedidoGrandeError";
  }
}

const consultarUmaVez = async (url: string): Promise<unknown> => {
  let resposta: Response;
  try {
    resposta = await fetch(url, {signal: AbortSignal.timeout(TIMEOUT_MS)});
  } catch (error) {
    log.warn("SugestaoEvento", "Rede do Instagram falhou", erroDe(error));
    throw new InstagramRedeError();
  }
  const corpo: unknown = await resposta.json().catch(() => null);
  if (ehBloqueio(resposta.status, corpo)) {
    const mensagem = mensagemDe(corpo).slice(0, 180);
    log.info("SugestaoEvento", "Instagram sem permissão", {
      status: resposta.status,
      codigo: codigoDe(corpo),
      mensagem,
    });
    throw new InstagramBloqueadoError(
      mensagem || "Instagram sem permissão de conteúdo público",
    );
  }
  if (mensagemDe(corpo).toLowerCase().includes("reduce the amount of data")) {
    throw new PedidoGrandeError();
  }
  if (resposta.status >= 500 || resposta.status === 429) {
    throw new InstagramRedeError();
  }
  if (!resposta.ok) {
    log.warn("SugestaoEvento", "Consulta do Instagram recusada", {
      status: resposta.status,
      codigo: codigoDe(corpo),
    });
    return null;
  }
  return corpo;
};

const consultar = async (url: string): Promise<unknown> => {
  try {
    return await consultarUmaVez(url);
  } catch (error) {
    if (!(error instanceof InstagramRedeError)) {
      throw error;
    }
    return consultarUmaVez(url);
  }
};

const CONTA_INSTAGRAM = "rolemotobr";

type ContaLigada = {
  id: string;
  username: string;
};

const contasLigadas = (corpo: unknown): ContaLigada[] => {
  if (!corpo || typeof corpo !== "object") {
    return [];
  }
  const lista = (corpo as {data?: unknown}).data;
  if (!Array.isArray(lista)) {
    return [];
  }
  const saida: ContaLigada[] = [];
  for (const item of lista) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const conta = (item as {
      instagram_business_account?: {id?: unknown; username?: unknown};
    }).instagram_business_account;
    const id = conta?.id;
    if (typeof id !== "string" || !/^[0-9]{5,32}$/.test(id)) {
      continue;
    }
    saida.push({
      id,
      username: typeof conta?.username === "string" ? conta.username : "",
    });
  }
  return saida;
};

const proximaDe = (corpo: unknown): string | null => {
  if (!corpo || typeof corpo !== "object") {
    return null;
  }
  const next = (corpo as {paging?: {next?: unknown}}).paging?.next;
  return typeof next === "string" && next.startsWith("https://") ? next : null;
};

const resolverUsuario = async (token: string): Promise<string | null> => {
  let url: string | null = (() => {
    const contas = new URL(`${HOST}/${VERSAO}/me/accounts`);
    contas.searchParams.set(
      "fields",
      "instagram_business_account{id,username}",
    );
    contas.searchParams.set("limit", "25");
    contas.searchParams.set("access_token", token);
    return contas.toString();
  })();
  const ligadas: ContaLigada[] = [];
  for (let pagina = 0; pagina < PAGINAS && url; pagina += 1) {
    const corpo = await consultar(url);
    ligadas.push(...contasLigadas(corpo));
    url = proximaDe(corpo);
  }
  const alvo = ligadas.find((conta) => conta.username === CONTA_INSTAGRAM);
  if (!alvo) {
    log.info("SugestaoEvento", "Conta @rolemotobr não está no token", {
      contas: ligadas.map((conta) => conta.username).filter(Boolean),
    });
    return null;
  }
  return alvo.id;
};

const idHashtag = async (
  token: string,
  userId: string,
  hashtag: string,
  cache: Map<string, string>,
): Promise<string | null> => {
  const salva = cache.get(hashtag);
  if (salva) {
    return salva;
  }
  const url = new URL(`${HOST}/${VERSAO}/ig_hashtag_search`);
  url.searchParams.set("user_id", userId);
  url.searchParams.set("q", hashtag);
  url.searchParams.set("access_token", token);
  const corpo = await consultar(url.toString());
  if (!corpo || typeof corpo !== "object") {
    return null;
  }
  const lista = (corpo as {data?: unknown}).data;
  const primeiro = Array.isArray(lista) ? lista[0] : null;
  const id = primeiro && typeof primeiro === "object" ?
    (primeiro as {id?: unknown}).id :
    null;
  if (typeof id !== "string" || !/^[0-9]{5,32}$/.test(id)) {
    return null;
  }
  cache.set(hashtag, id);
  return id;
};

const tipoDe = (valor: unknown): MidiaInstagram["mediaType"] | null => {
  if (valor === "IMAGE" || valor === "VIDEO" || valor === "CAROUSEL_ALBUM") {
    return valor;
  }
  return null;
};

const midiaDe = (valor: unknown): MidiaInstagram | null => {
  if (!valor || typeof valor !== "object") {
    return null;
  }
  const item = valor as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id : "";
  const mediaType = tipoDe(item.media_type);
  if (!/^[0-9]{5,32}$/.test(id) || !mediaType) {
    return null;
  }
  const caption = typeof item.caption === "string" ? item.caption.slice(0, 2000) : "";
  const mediaUrl = typeof item.media_url === "string" ? item.media_url : "";
  const permalink = typeof item.permalink === "string" ? item.permalink : "";
  const timestamp = typeof item.timestamp === "string" ? item.timestamp : "";
  return {
    id,
    caption,
    mediaType,
    mediaUrl: mediaType === "VIDEO" ? "" : mediaUrl,
    permalink,
    timestamp,
  };
};

const recente = (timestamp: string, agora: number): boolean => {
  const ms = Date.parse(timestamp);
  if (Number.isNaN(ms)) {
    return false;
  }
  return ms <= agora + 5 * 60 * 1000 && agora - ms <= JANELA_MS;
};

const primeiraImagem = async (
  token: string,
  mediaId: string,
): Promise<string> => {
  const url = new URL(`${HOST}/${VERSAO}/${mediaId}/children`);
  url.searchParams.set("fields", "media_type,media_url");
  url.searchParams.set("limit", "10");
  url.searchParams.set("access_token", token);
  const corpo = await consultar(url.toString());
  if (!corpo || typeof corpo !== "object") {
    return "";
  }
  const lista = (corpo as {data?: unknown}).data;
  if (!Array.isArray(lista)) {
    return "";
  }
  for (const item of lista) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const filho = item as {media_type?: unknown; media_url?: unknown};
    if (filho.media_type === "IMAGE" && typeof filho.media_url === "string") {
      return filho.media_url;
    }
  }
  return "";
};

const comLimite = (url: string, limite: number): string => {
  const ajustada = new URL(url);
  ajustada.searchParams.set("limit", String(limite));
  return ajustada.toString();
};

const consultarPagina = async (url: string): Promise<unknown> => {
  try {
    return await consultar(url);
  } catch (error) {
    if (!(error instanceof PedidoGrandeError)) {
      throw error;
    }
    try {
      return await consultar(comLimite(url, LIMITE_REDUZIDO));
    } catch (erroReduzido) {
      if (erroReduzido instanceof PedidoGrandeError) {
        throw new InstagramRedeError();
      }
      throw erroReduzido;
    }
  }
};

const paginasDaHashtag = async (
  token: string,
  userId: string,
  hashtagId: string,
  agora: number,
): Promise<MidiaInstagram[]> => {
  const inicial = new URL(`${HOST}/${VERSAO}/${hashtagId}/recent_media`);
  inicial.searchParams.set("user_id", userId);
  inicial.searchParams.set("fields", "id,caption,media_type,media_url,permalink,timestamp");
  inicial.searchParams.set("limit", String(LIMITE_PAGINA));
  inicial.searchParams.set("access_token", token);
  const saida: MidiaInstagram[] = [];
  let url: string | null = inicial.toString();
  for (let pagina = 0; pagina < PAGINAS && url; pagina += 1) {
    const corpo = await consultarPagina(url);
    const lista = corpo && typeof corpo === "object" ?
      (corpo as {data?: unknown}).data :
      null;
    if (Array.isArray(lista)) {
      for (const item of lista) {
        const midia = midiaDe(item);
        if (!midia || !recente(midia.timestamp, agora)) {
          continue;
        }
        if (!midia.caption.trim() && !midia.mediaUrl && midia.mediaType !== "CAROUSEL_ALBUM") {
          continue;
        }
        saida.push(midia);
      }
    }
    url = proximaDe(corpo);
  }
  return saida;
};

/** Posts públicos das últimas 24 h. O id da hashtag fica só nesta rodada. */
export const listarMidiasInstagram = async (
  token: string,
  hashtags: readonly string[],
  agora = Date.now(),
): Promise<MidiaInstagram[]> => {
  const userId = await resolverUsuario(token);
  if (!userId) {
    throw new InstagramBloqueadoError(
      "Token sem a Página da conta profissional",
    );
  }
  const cache = new Map<string, string>();
  let falhas = 0;
  const porHashtag = await emLotes(hashtags, HASHTAGS_EM_PARALELO, async (hashtag) => {
    try {
      const hashtagId = await idHashtag(token, userId, hashtag, cache);
      if (!hashtagId) {
        return [];
      }
      return await paginasDaHashtag(token, userId, hashtagId, agora);
    } catch (error) {
      if (!(error instanceof InstagramRedeError)) {
        throw error;
      }
      falhas += 1;
      log.warn("SugestaoEvento", "Hashtag do Instagram ignorada", {hashtag});
      return [];
    }
  });
  if (hashtags.length > 0 && falhas === hashtags.length) {
    throw new InstagramRedeError();
  }
  const vistas = new Set<string>();
  const saida: MidiaInstagram[] = [];
  for (const midia of porHashtag.flat()) {
    if (vistas.has(midia.id)) {
      continue;
    }
    vistas.add(midia.id);
    saida.push(midia);
  }
  return saida;
};

/** Carrossel vem sem `media_url`. Só busca a primeira imagem do post que vai ser lido. */
export const completarImagemCarrossel = async (
  token: string,
  midia: MidiaInstagram,
): Promise<MidiaInstagram> => {
  if (midia.mediaType !== "CAROUSEL_ALBUM" || midia.mediaUrl) {
    return midia;
  }
  try {
    return {...midia, mediaUrl: await primeiraImagem(token, midia.id)};
  } catch (error) {
    if (error instanceof InstagramBloqueadoError) {
      throw error;
    }
    return midia;
  }
};
