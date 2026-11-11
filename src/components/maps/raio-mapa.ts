const ZOOM_LOCAL = 16;

/** Mesma cor do alfinete; overlay do mapa não lê variável CSS. */
export const COR_CIRCULO = "#ff4500";

/** Zoom do voo até o pino. Com círculo, afasta para o raio caber no mapa de ~240 px. */
export const zoomDoPonto = (raioMetros?: number): number => {
  if (!raioMetros || raioMetros <= 0) return ZOOM_LOCAL;
  if (raioMetros <= 250) return 15;
  if (raioMetros <= 600) return 14;
  if (raioMetros <= 1200) return 13;
  return 12;
};
