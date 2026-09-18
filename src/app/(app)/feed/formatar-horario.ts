const TZ = "America/Sao_Paulo";

const ymdSaoPaulo = (data: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);

const somarDiasYmd = (ymd: string, dias: number): string => {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return dt.toISOString().slice(0, 10);
};

export const formatarHora = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));

const capitalizar = (texto: string): string =>
  texto.charAt(0).toUpperCase() + texto.slice(1);

/** Faixa do hero do convite: "Domingo, 24 de Novembro • Encontro às 06:30h". */
export const formatarFaixaHero = (iso: string): string => {
  const data = new Date(iso);
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "long",
  }).format(data);
  const dia = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "numeric",
  }).format(data);
  const mes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    month: "long",
  }).format(data);
  const hora = formatarHora(iso);
  return `${capitalizar(weekday)}, ${dia} de ${capitalizar(mes)} • Encontro às ${hora}h`;
};

export const formatarHorarioSaida = (iso: string): string => {
  const data = new Date(iso);
  const hora = formatarHora(iso);
  const ymd = ymdSaoPaulo(data);
  const hoje = ymdSaoPaulo(new Date());
  if (ymd === hoje) return `Hoje, ${hora}`;
  if (ymd === somarDiasYmd(hoje, 1)) return `Amanhã, ${hora}`;

  const weekday = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "long",
  }).format(data);
  const capitalizado = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizado}, ${hora}`;
};

/** Badge do card de evento: "Hoje às 19:30". */
export const formatarHorarioEvento = (iso: string): string => {
  const data = new Date(iso);
  const hora = formatarHora(iso);
  const ymd = ymdSaoPaulo(data);
  const hoje = ymdSaoPaulo(new Date());
  if (ymd === hoje) return `Hoje às ${hora}`;
  if (ymd === somarDiasYmd(hoje, 1)) return `Amanhã às ${hora}`;

  const weekday = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "short",
  }).format(data);
  const capitalizado = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizado} às ${hora}`;
};

export const formatarDataCurta = (ymd: string): string => {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
};
