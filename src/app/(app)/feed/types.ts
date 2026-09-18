import type { Pilotagem } from "@/types/user";

export type AbaFeed = "roles" | "eventos" | "locais";

export type RaioKm = 25 | 50 | 100 | null;

export type FiltroQuando =
  | "hoje"
  | "amanha"
  | "fim_de_semana"
  | "proximos_roles"
  | { tipo: "data"; iso: string };

export type FiltroRitmo = Pilotagem | "todas";

export type PontoFeed = {
  lat: number;
  lng: number;
  label: string;
  origem: "gps" | "custom";
};

export type FiltrosFeed = {
  ponto: PontoFeed | null;
  raioKm: RaioKm;
  quando: FiltroQuando | null;
  ritmo: FiltroRitmo;
  busca: string;
};

export type StatusLocalizacao = "obtendo" | "ok" | "negado" | "indisponivel";
