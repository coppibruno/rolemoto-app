const TZ = "America/Sao_Paulo";

const ler = (
  parts: Intl.DateTimeFormatPart[],
  tipo: Intl.DateTimeFormatPartTypes,
): string => parts.find((parte) => parte.type === tipo)?.value ?? "";

export const partirIsoEvento = (iso: string): { data: string; hora: string } => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  return {
    data: `${ler(parts, "year")}-${ler(parts, "month")}-${ler(parts, "day")}`,
    hora: `${ler(parts, "hour")}:${ler(parts, "minute")}`,
  };
};
