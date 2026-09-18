import { api } from "@/lib/api";
import type { LocalFeedItem } from "@/types/local";
import type { FiltrosFeed } from "../types";

export type ListarLocaisParams = {
  lat: number;
  lng: number;
  raioKm?: 25 | 50 | 100;
  q?: string;
};

const montarQuery = (params: ListarLocaisParams) => {
  const qs = new URLSearchParams();
  qs.set("lat", String(params.lat));
  qs.set("lng", String(params.lng));
  if (params.raioKm) qs.set("raioKm", String(params.raioKm));
  if (params.q?.trim()) qs.set("q", params.q.trim());
  return qs.toString();
};

export const filtrosParaLocais = (
  filtros: Pick<FiltrosFeed, "ponto" | "raioKm" | "busca">
): ListarLocaisParams | null => {
  if (!filtros.ponto) return null;
  return {
    lat: filtros.ponto.lat,
    lng: filtros.ponto.lng,
    ...(filtros.raioKm ? { raioKm: filtros.raioKm } : {}),
    ...(filtros.busca.trim() ? { q: filtros.busca.trim() } : {}),
  };
};

export const locaisService = {
  listar: (params: ListarLocaisParams) =>
    api<LocalFeedItem[]>(`/locais?${montarQuery(params)}`),
};
