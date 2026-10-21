import type { SeloId, SeloPublico } from "@/types/selo";

export const MAX_SELOS_VISIVEIS = 4;

export const ICONES_SELO: Record<SeloId, string> = {
  primeira_parada: "where_to_vote",
  postos_da_estrada: "local_gas_station",
  moto_point: "sports_bar",
  cacador_de_vista: "landscape",
  parada_de_fome: "restaurant",
  oficina_confianca: "build",
  rodou_o_mapa: "map",
};

export const normalizarSelos = (valor: unknown): SeloPublico[] => {
  if (!Array.isArray(valor)) return [];
  return valor.filter((item): item is SeloPublico => {
    if (!item || typeof item !== "object") return false;
    const bruto = item as { id?: unknown; label?: unknown };
    return typeof bruto.id === "string" && typeof bruto.label === "string";
  });
};
