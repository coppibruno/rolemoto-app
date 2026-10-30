const TZ = "America/Sao_Paulo";

export const MAX_DURACAO_EVENTO_MS = 7 * 24 * 60 * 60 * 1000;

const FOLGA_PASSADO_MS = 12 * 60 * 60 * 1000;

const MESES: Record<string, number> = {
  JAN: 1,
  FEV: 2,
  MAR: 3,
  ABR: 4,
  MAI: 5,
  JUN: 6,
  JUL: 7,
  AGO: 8,
  SET: 9,
  OUT: 10,
  NOV: 11,
  DEZ: 12,
};

export type IntervaloCartaz = {
  inicio: string;
  fim: string | null;
};

const offsetSaoPauloMs = (instante: Date): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instante);
  const ler = (tipo: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((parte) => parte.type === tipo)?.value ?? "0");
  const hora = ler("hour") % 24;
  const comoUtc = Date.UTC(
    ler("year"),
    ler("month") - 1,
    ler("day"),
    hora,
    ler("minute"),
    ler("second"),
  );
  return comoUtc - instante.getTime();
};

/** Relógio de parede em America/Sao_Paulo, no mesmo critério do cadastro. */
export const paredeSaoPauloIso = (
  ano: number,
  mes: number,
  dia: number,
  hora: number,
  minuto: number,
): string => {
  const chute = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto, 0, 0));
  const ajustado = new Date(chute.getTime() - offsetSaoPauloMs(chute));
  return new Date(chute.getTime() - offsetSaoPauloMs(ajustado)).toISOString();
};

const calendarioSp = (agora: Date): {ano: number; mes: number} => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(agora);
  const ler = (tipo: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((parte) => parte.type === tipo)?.value ?? "0");
  return {ano: ler("year"), mes: ler("month")};
};

const parseHora = (valor: string): [number, number] => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(valor.trim());
  if (!match) {
    return [12, 0];
  }
  const hora = Number(match[1]);
  const minuto = Number(match[2]);
  if (hora > 23 || minuto > 59) {
    return [12, 0];
  }
  return [hora, minuto];
};

const mesDoCartaz = (valor: string): number | null => {
  const chave = valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .slice(0, 3)
    .toUpperCase();
  return MESES[chave] ?? null;
};

const jaPassou = (iso: string, agora: Date): boolean =>
  Date.parse(iso) < agora.getTime() - FOLGA_PASSADO_MS;

/**
 * O cartaz traz dia e mês. Janeiro listado em dezembro cai no ano seguinte.
 * Dia já passado no mês corrente não é empurrado para o ano que vem.
 */
export const intervaloDoCartaz = (
  diaTexto: string,
  mesTexto: string,
  horaTexto: string,
  agora: Date,
): IntervaloCartaz | null => {
  const mes = mesDoCartaz(mesTexto);
  if (!mes) {
    return null;
  }
  const numeros = diaTexto.split(/[^\d]+/).filter(Boolean).map(Number);
  if (numeros.length === 0 || numeros.some((dia) => dia < 1 || dia > 31)) {
    return null;
  }
  const [hora, minuto] = parseHora(horaTexto);
  const hoje = calendarioSp(agora);
  let ano = hoje.ano;
  let inicio = paredeSaoPauloIso(ano, mes, numeros[0], hora, minuto);
  if (jaPassou(inicio, agora) && mes < hoje.mes) {
    ano += 1;
    inicio = paredeSaoPauloIso(ano, mes, numeros[0], hora, minuto);
  }
  if (jaPassou(inicio, agora)) {
    return null;
  }

  const fimDia = numeros.length > 1 ? numeros[numeros.length - 1] : null;
  if (!fimDia || fimDia === numeros[0]) {
    return {inicio, fim: null};
  }
  let mesFim = mes;
  let anoFim = ano;
  if (fimDia < numeros[0]) {
    mesFim += 1;
    if (mesFim > 12) {
      mesFim = 1;
      anoFim += 1;
    }
  }
  return {
    inicio,
    fim: paredeSaoPauloIso(anoFim, mesFim, fimDia, hora, minuto),
  };
};

/**
 * A página do MotoClub grava o relógio local com offset +00:00.
 * Os dígitos são o horário de São Paulo, não UTC.
 */
export const instanteDoJsonLd = (
  valor: string,
  horaHerdada: string,
): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(valor.trim());
  if (!match) {
    return null;
  }
  const herdada = parseHora(horaHerdada);
  const hora = match[4] ? Number(match[4]) : herdada[0];
  const minuto = match[5] ? Number(match[5]) : herdada[1];
  if (hora > 23 || minuto > 59) {
    return null;
  }
  return paredeSaoPauloIso(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    hora,
    minuto,
  );
};

export const horaDoIso = (iso: string): string => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const ler = (tipo: Intl.DateTimeFormatPartTypes): string =>
    parts.find((parte) => parte.type === tipo)?.value ?? "00";
  return `${ler("hour")}:${ler("minute")}`;
};

export const encerramentoValido = (
  inicioIso: string,
  fimIso: string | null,
): {iso: string | null; limitado: boolean} => {
  if (!fimIso) {
    return {iso: null, limitado: false};
  }
  const abertura = Date.parse(inicioIso);
  const fim = Date.parse(fimIso);
  if (Number.isNaN(abertura) || Number.isNaN(fim) || fim <= abertura) {
    return {iso: null, limitado: false};
  }
  if (fim - abertura > MAX_DURACAO_EVENTO_MS) {
    return {
      iso: new Date(abertura + MAX_DURACAO_EVENTO_MS - 60_000).toISOString(),
      limitado: true,
    };
  }
  return {iso: fimIso, limitado: false};
};

/** `motoclub_{slug}_{aaaa-mm-dd}` — o slug e a data são separados por `_`. */
export const ID_SUGESTAO_EVENTO_RE =
  /^motoclub_[a-z0-9-]{8,120}_\d{4}-\d{2}-\d{2}$/;

export const idSugestaoEvento = (slug: string, inicioIso: string): string => {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(inicioIso));
  return `motoclub_${slug}_${ymd}`;
};
