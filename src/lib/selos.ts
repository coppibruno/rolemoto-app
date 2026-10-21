import type { CategoriaLocal } from "@/types/local";
import type { SeloPublico } from "@/types/selo";

export const MAX_SELOS_VISIVEIS = 4;

const ICONES: Record<CategoriaLocal, string> = {
  posto: "local_gas_station",
  bar_moto_point: "sports_bar",
  restaurante_estrada: "restaurant",
  oficina: "build",
  mirante: "landscape",
};

export const iconeSelo = (selo: SeloPublico): string =>
  ICONES[selo.categoria] ?? "where_to_vote";
