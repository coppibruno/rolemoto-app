const TZ = "America/Sao_Paulo";

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
    get("second")
  );
  return comoUtc - instante.getTime();
};

const paredeSaoPauloParaDate = (
  ymd: string,
  hora: number,
  minuto: number
): Date => {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  const chuteUtc = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto, 0, 0));
  const ajustado = new Date(chuteUtc.getTime() - offsetSaoPauloMs(chuteUtc));
  return new Date(chuteUtc.getTime() - offsetSaoPauloMs(ajustado));
};

export const montarIsoSaida = (dataSaida: string, horaSaida: string): string => {
  const [hora, minuto] = horaSaida.split(":").map(Number);
  return paredeSaoPauloParaDate(dataSaida, hora, minuto).toISOString();
};

export const hojeYmdSaoPaulo = (): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const ymdSaoPauloDeIso = (iso: string): string => {
  const instante = new Date(iso);
  if (Number.isNaN(instante.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
};
