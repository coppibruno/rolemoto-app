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

export const formatarDataCurta = (ymd: string): string => {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
};
