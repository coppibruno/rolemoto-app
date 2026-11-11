import type {MarcaPost} from "../types/post-foto";

export const LIMITE_LEGENDA = 500;
export const LIMITE_COMENTARIO = 280;
export const TETO_POSTS_DIA = 10;

export const ERRO_LEGENDA = "legenda longa demais";
export const ERRO_COMENTARIO_VAZIO = "escreva um comentário";
export const ERRO_COMENTARIO_LONGO = "comentário longo demais";
export const ERRO_MARCA = "marca inválida";

type Validado<T> = {ok: true; valor: T} | {ok: false; erro: string};

export const legendaDe = (valor: unknown): Validado<string> => {
  if (valor === undefined || valor === null || valor === "") {
    return {ok: true, valor: ""};
  }
  if (typeof valor !== "string") {
    return {ok: false, erro: ERRO_LEGENDA};
  }
  const limpa = valor.trim();
  if (limpa.length > LIMITE_LEGENDA) {
    return {ok: false, erro: ERRO_LEGENDA};
  }
  return {ok: true, valor: limpa};
};

export const comentarioDe = (valor: unknown): Validado<string> => {
  if (typeof valor !== "string") {
    return {ok: false, erro: ERRO_COMENTARIO_LONGO};
  }
  const limpo = valor.trim();
  if (!limpo) {
    return {ok: false, erro: ERRO_COMENTARIO_VAZIO};
  }
  if (limpo.length > LIMITE_COMENTARIO) {
    return {ok: false, erro: ERRO_COMENTARIO_LONGO};
  }
  return {ok: true, valor: limpo};
};

export const marcaDe = (valor: unknown): Validado<MarcaPost | null> => {
  if (valor === undefined || valor === null) {
    return {ok: true, valor: null};
  }
  if (typeof valor !== "object" || Array.isArray(valor)) {
    return {ok: false, erro: ERRO_MARCA};
  }
  const bruto = valor as Record<string, unknown>;
  const chaves = Object.keys(bruto).sort();
  if (chaves.length !== 2 || chaves[0] !== "id" || chaves[1] !== "tipo") {
    return {ok: false, erro: ERRO_MARCA};
  }
  const {tipo, id} = bruto;
  if (tipo !== "local" && tipo !== "evento") {
    return {ok: false, erro: ERRO_MARCA};
  }
  const limpo = typeof id === "string" ? id.trim() : "";
  if (!limpo || limpo.includes("/")) {
    return {ok: false, erro: ERRO_MARCA};
  }
  return {ok: true, valor: {tipo, id: limpo}};
};

export const dentroDoTeto = (quantidadeNaJanela: number): boolean =>
  quantidadeNaJanela < TETO_POSTS_DIA;

type StoryComPost = {postId: string | null; expiresAt: string};

export const storyJaEncaminhada = (
  stories: StoryComPost[],
  postId: string,
  agora: Date,
): boolean =>
  stories.some((story) =>
    story.postId === postId && Date.parse(story.expiresAt) > agora.getTime(),
  );
