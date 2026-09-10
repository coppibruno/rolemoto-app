const TZ = "America/Sao_Paulo";

const mesCurto = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    month: "short",
  })
    .format(new Date(iso))
    .replace(".", "")
    .trim();

export const formatarDiaMes = (iso: string): { dia: string; mes: string } => {
  const data = new Date(iso);
  const dia = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
  }).format(data);
  return { dia, mes: mesCurto(iso).toUpperCase() };
};

export const formatarDataMeta = (iso: string): string => {
  const dia = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "numeric",
  }).format(new Date(iso));
  const mes = mesCurto(iso);
  const mesTitle = mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase();
  return `${dia} ${mesTitle}`;
};
