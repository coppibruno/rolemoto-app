import { api } from "@/lib/api";
import type { EventoFeedItem } from "@/types/evento";
import type { FiltroQuando, FiltrosFeed } from "../types";

export type ListarEventosParams = {
  lat: number;
  lng: number;
  raioKm?: 25 | 50 | 100;
  quando?: "hoje" | "amanha" | "fim_de_semana" | "proximos_roles" | "data";
  data?: string;
  q?: string;
};

const montarQuery = (params: ListarEventosParams) => {
  const qs = new URLSearchParams();
  qs.set("lat", String(params.lat));
  qs.set("lng", String(params.lng));
  if (params.raioKm) qs.set("raioKm", String(params.raioKm));
  if (params.quando) qs.set("quando", params.quando);
  if (params.data) qs.set("data", params.data);
  if (params.q?.trim()) qs.set("q", params.q.trim());
  return qs.toString();
};

const quandoParaQuery = (
  quando: FiltroQuando | null
): Pick<ListarEventosParams, "quando" | "data"> => {
  if (!quando) return {};
  if (typeof quando === "object") {
    return { quando: "data", data: quando.iso };
  }
  return { quando };
};

export const filtrosParaEventos = (
  filtros: Omit<FiltrosFeed, "ritmo">
): ListarEventosParams | null => {
  if (!filtros.ponto) return null;
  return {
    lat: filtros.ponto.lat,
    lng: filtros.ponto.lng,
    ...(filtros.raioKm ? { raioKm: filtros.raioKm } : {}),
    ...quandoParaQuery(filtros.quando),
    ...(filtros.busca.trim() ? { q: filtros.busca.trim() } : {}),
  };
};

export const eventosService = {
  listar: (params: ListarEventosParams) =>
    api<EventoFeedItem[]>(`/eventos?${montarQuery(params)}`),
};
