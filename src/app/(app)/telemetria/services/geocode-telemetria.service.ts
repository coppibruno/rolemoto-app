import { geocodeService } from "@/lib/geocode";
import type { PontoTelemetria } from "@/types/role-telemetria";

const rotular = async (ponto: PontoTelemetria): Promise<PontoTelemetria> => {
  if (ponto.nome.trim() || ponto.endereco.trim()) {
    return ponto;
  }
  try {
    const label = await geocodeService.reverso(ponto.lat, ponto.lng, {
      estiloLabel: "curto",
    });
    if (!label || label === "Sua localização") {
      return ponto;
    }
    return { ...ponto, nome: label, endereco: label };
  } catch {
    return ponto;
  }
};

export const geocodePontosTelemetria = async (
  inicio: PontoTelemetria,
  fim: PontoTelemetria,
): Promise<{ pontoInicio: PontoTelemetria; pontoFim: PontoTelemetria }> => {
  const [pontoInicio, pontoFim] = await Promise.all([
    rotular(inicio),
    rotular(fim),
  ]);
  return { pontoInicio, pontoFim };
};
