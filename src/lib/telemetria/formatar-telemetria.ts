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
