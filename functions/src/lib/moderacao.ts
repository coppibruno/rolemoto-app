import {
  ALVOS_DENUNCIA,
  JANELA_DEDUPE_DENUNCIA_MS,
  LIMITE_DETALHES_DENUNCIA,
  MOTIVOS_DENUNCIA,
  type AlvoDenuncia,
  type MotivoDenuncia,
} from "../types/moderacao";

export const ERRO_BLOQUEAR_SI = "não dá para bloquear a si mesmo";
export const ERRO_DENUNCIAR_PROPRIO = "não dá para denunciar o próprio conteúdo";
export const ERRO_DETALHES_OUTRO = "conte o que aconteceu";
export const ERRO_SEGUE_BLOQUEADO = "não é possível seguir";
export const ERRO_COMENTAR_BLOQUEADO = "não é possível comentar";
export const ERRO_MENSAGEM_BLOQUEADO = "não é possível enviar mensagem";
export const ERRO_PERFIL_INDISPONIVEL = "Perfil indisponível";

export const ROTULOS_MOTIVO: Record<MotivoDenuncia, string> = {
  spam: "Spam ou golpe",
  assedio: "Assédio ou bullying",
  odio: "Discurso de ódio",
  nudez: "Nudez ou conteúdo sexual",
  violencia: "Violência ou ameaça",
  outro: "Outro",
};

/** Id determinístico `{bloqueadorId}_{bloqueadoId}`. */
export const idBloqueio = (bloqueadorId: string, bloqueadoId: string): string =>
  `${bloqueadorId}_${bloqueadoId}`;

export const ehMotivoDenuncia = (valor: unknown): valor is MotivoDenuncia =>
  typeof valor === "string" &&
  (MOTIVOS_DENUNCIA as readonly string[]).includes(valor);

export const ehAlvoDenuncia = (valor: unknown): valor is AlvoDenuncia =>
  typeof valor === "string" &&
  (ALVOS_DENUNCIA as readonly string[]).includes(valor);

/** Trim + teto 280. `null` se o valor não é string. */
export const normalizarDetalhes = (valor: unknown): string | null => {
  if (valor === undefined || valor === null) {
    return "";
  }
  if (typeof valor !== "string") {
    return null;
  }
  return valor.trim().slice(0, LIMITE_DETALHES_DENUNCIA);
};

export type BodyDenunciaValido = {
  alvoTipo: AlvoDenuncia;
  alvoId: string;
  motivo: MotivoDenuncia;
  detalhes: string;
};

export type BodyDenunciaInvalido = {
  erro: string;
};

/**
 * Valida o body de `POST /denuncias`.
 * Se `outro`, detalhes trim ≥ 3.
 */
export const validarBodyDenuncia = (
  body: Record<string, unknown>,
): BodyDenunciaValido | BodyDenunciaInvalido => {
  if (!ehAlvoDenuncia(body.alvoTipo)) {
    return {erro: "alvoTipo inválido"};
  }
  const alvoId = typeof body.alvoId === "string" ? body.alvoId.trim() : "";
  if (!alvoId || alvoId.includes("/")) {
    return {erro: "alvoId inválido"};
  }
  if (!ehMotivoDenuncia(body.motivo)) {
    return {erro: "motivo inválido"};
  }
  const detalhes = normalizarDetalhes(body.detalhes);
  if (detalhes === null) {
    return {erro: "detalhes inválidos"};
  }
  if (body.motivo === "outro" && detalhes.length < 3) {
    return {erro: ERRO_DETALHES_OUTRO};
  }
  return {
    alvoTipo: body.alvoTipo,
    alvoId,
    motivo: body.motivo,
    detalhes,
  };
};

/** True se a denúncia anterior ainda está na janela de 24 h. */
export const dentroJanelaDedupe = (
  createdAtIso: string,
  agoraMs: number = Date.now(),
): boolean => {
  const criado = Date.parse(createdAtIso);
  if (!Number.isFinite(criado)) {
    return false;
  }
  return agoraMs - criado < JANELA_DEDUPE_DENUNCIA_MS;
};

/** True se `outroUid` está no set de bloqueios do token (qualquer sentido). */
export const estaNoParBloqueado = (
  bloqueados: ReadonlySet<string>,
  outroUid: string,
): boolean => Boolean(outroUid) && bloqueados.has(outroUid);

/** Filtra lista omitindo itens cujo campo aponta para uid bloqueado. */
export const omitirBloqueados = <T>(
  itens: readonly T[],
  bloqueados: ReadonlySet<string>,
  uidDe: (item: T) => string,
): T[] => {
  if (bloqueados.size === 0) {
    return [...itens];
  }
  return itens.filter((item) => !estaNoParBloqueado(bloqueados, uidDe(item)));
};
