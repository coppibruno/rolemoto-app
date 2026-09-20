const TZ = "America/Sao_Paulo";

export const tituloPadraoTelemetria = (encerradoEm: string): string => {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(encerradoEm));
  const valor = (tipo: Intl.DateTimeFormatPartTypes): string =>
    partes.find((p) => p.type === tipo)?.value ?? "";
  return `Rolê · ${valor("day")}/${valor("month")} ${valor("hour")}:${valor("minute")}`;
};

export const formatarConclusaoTelemetria = (iso: string): string => {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const valor = (tipo: Intl.DateTimeFormatPartTypes): string =>
    partes.find((p) => p.type === tipo)?.value ?? "";
  return `Concluído em ${valor("day")}/${valor("month")} às ${valor("hour")}:${valor("minute")}`;
};

export const formatarCoordCurta = (lat: number, lng: number): string =>
  `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

export const formatarCronometro = (segundos: number): string => {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

export const labelPontoTelemetria = (ponto: {
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
}): string =>
  ponto.nome.trim() ||
  ponto.endereco.trim() ||
  formatarCoordCurta(ponto.lat, ponto.lng);

export const formatarVelocidade = (kmh: number | null | undefined): string => {
  const valor = typeof kmh === "number" && Number.isFinite(kmh) ? kmh : 0;
  return `${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km/h`;
};

export const formatarDistancia = (km: number | null | undefined): string => {
  const valor = typeof km === "number" && Number.isFinite(km) ? km : 0;
  return `${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} km`;
};

export const formatarDuracao = (segundos: number | null | undefined): string => {
  const s = Math.max(
    0,
    Math.floor(typeof segundos === "number" && Number.isFinite(segundos) ? segundos : 0),
  );
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const resto = s % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, "0")}min`;
  }
  return `${m}min ${String(resto).padStart(2, "0")}s`;
};
