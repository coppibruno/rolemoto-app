import {
  geocodeService as geocodeBase,
  type SugestaoEndereco,
} from "@/lib/geocode";

export type { SugestaoEndereco };

export const geocodeService = {
  reverso: (lat: number, lng: number) =>
    geocodeBase.reverso(lat, lng, { estiloLabel: "curto" }),

  buscar: (q: string) =>
    geocodeBase.buscar(q, { estiloLabel: "curto", restritoSul: false }),
};
