import {horaSaoPaulo, ymdSaoPaulo} from "./quando";

export const LIMITE_ENVIO_CONVITE = 20;
export const LIMITE_SITUACAO_CONVITE = 30;
export const LIMITE_UID_CONVITE = 128;

export type ContextoConvite = {
  tokenUid: string;
  perfisExistentes: ReadonlySet<string>;
  inscritos: ReadonlySet<string>;
  jaConvidados: ReadonlySet<string>;
};

export type ClassificacaoConvites = {
  ignorados: string[];
  jaInscritos: string[];
  jaConvidados: string[];
  enviados: string[];
};

const DIAS: Record<string, string> = {
  Sun: "dom",
  Mon: "seg",
  Tue: "ter",
  Wed: "qua",
  Thu: "qui",
  Fri: "sex",
  Sat: "sáb",
};

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** Tira duplicata e preserva a ordem. `null` se o valor não é `string[]`. */
export const uidsUnicos = (valor: unknown): string[] | null => {
  if (!Array.isArray(valor)) {
    return null;
  }
  const vistos = new Set<string>();
  const unicos: string[] = [];
  for (const item of valor) {
    if (typeof item !== "string") {
      return null;
    }
    if (vistos.has(item)) {
      continue;
    }
    vistos.add(item);
    unicos.push(item);
  }
  return unicos;
};

/**
 * Separa o envio. Quem está inscrito não cai em `jaConvidados`,
 * mesmo que o doc do trio também exista.
 */
export const classificarConvites = (
  uids: readonly string[],
  contexto: ContextoConvite,
): ClassificacaoConvites => {
  const ignorados: string[] = [];
  const jaInscritos: string[] = [];
  const jaConvidados: string[] = [];
  const enviados: string[] = [];
  const vistos = new Set<string>();

  for (const uid of uids) {
    if (vistos.has(uid)) {
      continue;
    }
    vistos.add(uid);
    const invalido = uid.length === 0 || uid.length > LIMITE_UID_CONVITE;
    const semPerfil = !contexto.perfisExistentes.has(uid);
    if (invalido || uid === contexto.tokenUid || semPerfil) {
      ignorados.push(uid);
      continue;
    }
    if (contexto.inscritos.has(uid)) {
      jaInscritos.push(uid);
      continue;
    }
    if (contexto.jaConvidados.has(uid)) {
      jaConvidados.push(uid);
      continue;
    }
    enviados.push(uid);
  }

  return {ignorados, jaInscritos, jaConvidados, enviados};
};

/** Título do push. Título vazio vira "o evento". */
export const fraseConvite = (apelido: string, titulo: string): string => {
  const quem = apelido.trim() || "piloto";
  const nomeEvento = titulo.trim() || "o evento";
  return `${quem} te chamou para ${nomeEvento}`;
};

const parte = (
  parts: Intl.DateTimeFormatPart[],
  tipo: Intl.DateTimeFormatPartTypes,
): string => parts.find((item) => item.type === tipo)?.value ?? "";

const formatarInstante = (iso: string): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const diaSemana = DIAS[parte(parts, "weekday")] ?? "dom";
  const dia = String(Number(parte(parts, "day")));
  const mes = MESES[Number(parte(parts, "month")) - 1] ?? "jan";
  return `${diaSemana} ${dia} ${mes} · ${horaSaoPaulo(iso)}`;
};

/**
 * Abertura em São Paulo. Se o encerramento cai em outro dia,
 * acrescenta o fim depois de " – ".
 */
export const quandoConvite = (
  aberturaIso: string,
  encerramentoIso: string | null,
): string => {
  const abertura = formatarInstante(aberturaIso);
  if (!encerramentoIso) {
    return abertura;
  }
  const mesmoDia = ymdSaoPaulo(new Date(aberturaIso)) ===
    ymdSaoPaulo(new Date(encerramentoIso));
  if (mesmoDia) {
    return abertura;
  }
  return `${abertura} – ${formatarInstante(encerramentoIso)}`;
};
