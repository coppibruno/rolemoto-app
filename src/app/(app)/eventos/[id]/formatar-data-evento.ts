const TZ = "America/Sao_Paulo";

const capitalizar = (texto: string): string =>
  texto.charAt(0).toUpperCase() + texto.slice(1);

export const formatarDataExtenso = (iso: string): string => {
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
  return `${capitalizar(weekday)}, ${dia} de ${capitalizar(mes)}`;
};

export const formatarHoraEvento = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
