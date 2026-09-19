export const formatarVelocidade = (kmh: number): string =>
  `${kmh.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km/h`;

export const formatarDistancia = (km: number): string =>
  `${km.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} km`;

export const formatarDuracao = (segundos: number): string => {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const resto = s % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, "0")}min`;
  }
  return `${m}min ${String(resto).padStart(2, "0")}s`;
};
