import { api } from "@/lib/api";
import type { ContagensFeed } from "@/types/feed";
import type { RitmoRole } from "@/types/role";
import type { FiltroQuando, FiltrosFeed } from "../types";

export type ContagensParams = {
  lat: number;
  lng: number;
  raioKm?: 25 | 50 | 100;
  quando?: "hoje" | "amanha" | "fim_de_semana" | "proximos_roles" | "data";
  data?: string;
  ritmo?: RitmoRole;
  q?: string;
};

const montarQuery = (params: ContagensParams) => {
  const qs = new URLSearchParams();
  qs.set("lat", String(params.lat));
  qs.set("lng", String(params.lng));
  if (params.raioKm) qs.set("raioKm", String(params.raioKm));
  if (params.quando) qs.set("quando", params.quando);
  if (params.data) qs.set("data", params.data);
  if (params.ritmo) qs.set("ritmo", params.ritmo);
  if (params.q?.trim()) qs.set("q", params.q.trim());
  return qs.toString();
};

const quandoParaQuery = (
  quando: FiltroQuando | null
): Pick<ContagensParams, "quando" | "data"> => {
  if (!quando) return {};
  if (typeof quando === "object") {
    return { quando: "data", data: quando.iso };
  }
  return { quando };
};

export const filtrosParaContagens = (
  filtros: FiltrosFeed
): ContagensParams | null => {
  if (!filtros.ponto) return null;
  return {
    lat: filtros.ponto.lat,
    lng: filtros.ponto.lng,
    ...(filtros.raioKm ? { raioKm: filtros.raioKm } : {}),
    ...quandoParaQuery(filtros.quando),
    ...(filtros.ritmo !== "todas" ? { ritmo: filtros.ritmo } : {}),
    ...(filtros.busca.trim() ? { q: filtros.busca.trim() } : {}),
  };
};

export const feedService = {
  contagens: (params: ContagensParams) =>
    api<ContagensFeed>(`/feed/contagens?${montarQuery(params)}`),
};
