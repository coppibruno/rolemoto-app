import {LIMITE_TEXTO_MENSAGEM, REACOES_STORY, type ReacaoStory} from "../types/conversa";

export const ERRO_TEXTO_VAZIO = "escreva uma mensagem";
export const ERRO_TEXTO_LONGO = "mensagem longa demais";
export const ERRO_PARA_SI = "não dá para mandar mensagem para você mesmo";
export const ERRO_STORY_RESPOSTA = "Este story não está mais disponível";
export const ERRO_REACAO = "reação inválida";
export const ERRO_REACAO_SEM_STORY = "reação só vale para um story";

export const reacaoDe = (valor: unknown): ReacaoStory | null =>
  typeof valor === "string" && Object.prototype.hasOwnProperty.call(REACOES_STORY, valor) ?
    valor as ReacaoStory :
    null;

/** Linha da lista de conversas e do push quando a mensagem é uma reação. */
export const resumoReacao = (reacao: ReacaoStory): string =>
  `Reagiu ao seu story ${REACOES_STORY[reacao]}`;

const TRECHO_MAX = 80;

/** Uma conversa por par: os dois uids em ordem, separados por `_`. */
export const idConversa = (a: string, b: string): string =>
  a < b ? `${a}_${b}` : `${b}_${a}`;

/** O outro participante do id, se o token é um dos dois. Senão `null`. */
export const outroDaConversa = (conversaId: string, tokenUid: string): string | null => {
  if (!conversaId || !tokenUid || conversaId.includes("/")) {
    return null;
  }
  const candidatos: string[] = [];
  if (conversaId.startsWith(`${tokenUid}_`)) {
    candidatos.push(conversaId.slice(tokenUid.length + 1));
  }
  if (conversaId.endsWith(`_${tokenUid}`)) {
    candidatos.push(conversaId.slice(0, conversaId.length - tokenUid.length - 1));
  }
  return candidatos.find((outro) =>
    outro && outro !== tokenUid && idConversa(tokenUid, outro) === conversaId,
  ) ?? null;
};

export const textoMensagem = (
  valor: unknown,
): {ok: true; valor: string} | {ok: false; erro: string} => {
  if (typeof valor !== "string" || !valor.trim()) {
    return {ok: false, erro: ERRO_TEXTO_VAZIO};
  }
  const limpo = valor.trim();
  if (limpo.length > LIMITE_TEXTO_MENSAGEM) {
    return {ok: false, erro: ERRO_TEXTO_LONGO};
  }
  return {ok: true, valor: limpo};
};

export const trechoMensagem = (texto: string): string => {
  const umaLinha = texto.replace(/\s+/g, " ").trim();
  return umaLinha.length <= TRECHO_MAX ? umaLinha : `${umaLinha.slice(0, TRECHO_MAX - 1)}…`;
};

type StoryParaResposta = {usuarioId: string; expiresAt: string};

/** A story existe, não venceu e é de quem vai receber a resposta. */
export const storyValidaParaResposta = (
  story: StoryParaResposta | null,
  destinatarioId: string,
  agoraMs = Date.now(),
): boolean =>
  story !== null &&
  story.usuarioId === destinatarioId &&
  Date.parse(story.expiresAt) > agoraMs;
