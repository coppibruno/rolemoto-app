const TZ = "America/Sao_Paulo";

export type IntervaloQuando = {
  dataInicioIso: string;
  dataFimIso?: string;
};

const ymdSaoPaulo = (data: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);

/** Hora `HH:mm` em America/Sao_Paulo, sem timezone no string. */
export const horaSaoPaulo = (iso: string): string => {
  const instante = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instante);

  const get = (tipo: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === tipo)?.value ?? "00";

  const horaRaw = get("hour");
  const hora = (horaRaw === "24" ? "00" : horaRaw).padStart(2, "0");
  const minuto = get("minute").padStart(2, "0");
  return `${hora}:${minuto}`;
};

const weekdaySaoPaulo = (data: Date): number => {
  const nome = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(data);
  const mapa: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return mapa[nome] ?? data.getUTCDay();
};

const somarDiasYmd = (ymd: string, dias: number): string => {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return dt.toISOString().slice(0, 10);
};

/** Offset local−UTC (ms) de America/Sao_Paulo no instante dado. */
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

  const get = (tipo: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === tipo)?.value ?? "0");

  const hora = get("hour") === 24 ? 0 : get("hour");
  const comoUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hora,
    get("minute"),
    get("second"),
  );
  return comoUtc - instante.getTime();
};

const paredeSaoPauloParaDate = (
  ymd: string,
  hora = 0,
  minuto = 0,
  segundo = 0,
  ms = 0,
): Date => {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  const chuteUtc = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto, segundo, ms));
  const ajustado = new Date(chuteUtc.getTime() - offsetSaoPauloMs(chuteUtc));
  return new Date(chuteUtc.getTime() - offsetSaoPauloMs(ajustado));
};

const inicioDoDiaSp = (ymd: string): string =>
  paredeSaoPauloParaDate(ymd, 0, 0, 0, 0).toISOString();

const fimDoDiaSp = (ymd: string): string =>
  paredeSaoPauloParaDate(ymd, 23, 59, 59, 999).toISOString();

const maxIso = (a: string, b: string): string => (a > b ? a : b);

const fimDeSemanaYmd = (agora: Date): {sabado: string; domingo: string} => {
  const hoje = ymdSaoPaulo(agora);
  const dow = weekdaySaoPaulo(agora);
  if (dow === 6) {
    return {sabado: hoje, domingo: somarDiasYmd(hoje, 1)};
  }
  if (dow === 0) {
    return {sabado: somarDiasYmd(hoje, -1), domingo: hoje};
  }
  const sabado = somarDiasYmd(hoje, 6 - dow);
  return {sabado, domingo: somarDiasYmd(sabado, 1)};
};

/**
 * Converte o chip `quando` em intervalo ISO.
 * Sempre corta o início em `agora` (só rolês futuros ou no dia em andamento).
 */
export const resolverIntervaloQuando = (
  quando: "hoje" | "amanha" | "fim_de_semana" | "data" | undefined,
  dataYmd: string | undefined,
  agora = new Date(),
): IntervaloQuando => {
  const agoraIso = agora.toISOString();

  if (!quando) {
    return {dataInicioIso: agoraIso};
  }

  const hoje = ymdSaoPaulo(agora);

  if (quando === "hoje") {
    return {
      dataInicioIso: maxIso(agoraIso, inicioDoDiaSp(hoje)),
      dataFimIso: fimDoDiaSp(hoje),
    };
  }

  if (quando === "amanha") {
    const amanha = somarDiasYmd(hoje, 1);
    return {
      dataInicioIso: maxIso(agoraIso, inicioDoDiaSp(amanha)),
      dataFimIso: fimDoDiaSp(amanha),
    };
  }

  if (quando === "fim_de_semana") {
    const {sabado, domingo} = fimDeSemanaYmd(agora);
    return {
      dataInicioIso: maxIso(agoraIso, inicioDoDiaSp(sabado)),
      dataFimIso: fimDoDiaSp(domingo),
    };
  }

  if (quando === "data" && dataYmd) {
    return {
      dataInicioIso: maxIso(agoraIso, inicioDoDiaSp(dataYmd)),
      dataFimIso: fimDoDiaSp(dataYmd),
    };
  }

  return {dataInicioIso: agoraIso};
};
