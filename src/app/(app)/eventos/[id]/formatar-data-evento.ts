const TZ = "America/Sao_Paulo";

const capitalizar = (texto: string): string =>
  texto.charAt(0).toUpperCase() + texto.slice(1);

/** "Quarta-feira, 18/11". */
export const formatarDataExtenso = (iso: string): string => {
  const data = new Date(iso);
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "long",
  }).format(data);
  const diaMes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
  }).format(data);
  return `${capitalizar(weekday)}, ${diaMes}`;
};

export const formatarHoraEvento = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
