import type { FiltroQuando, FiltroRitmo, RaioKm } from "./types";

export const RAIO_PADRAO: RaioKm = 50;
export const QUANDO_PADRAO: FiltroQuando = "fim_de_semana";
export const RITMO_PADRAO: FiltroRitmo = "todas";

export const OPCOES_RAIO: { valor: RaioKm; label: string }[] = [
  { valor: 25, label: "Até 25 km" },
  { valor: 50, label: "Até 50 km" },
  { valor: 100, label: "Até 100 km" },
  { valor: null, label: "Sem limite" },
];

export const OPCOES_QUANDO: {
  valor: Exclude<FiltroQuando, { tipo: "data" }>;
  label: string;
}[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "amanha", label: "Amanhã" },
  { valor: "fim_de_semana", label: "Neste Fim de Semana" },
];

export const OPCOES_RITMO: { valor: FiltroRitmo; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "tranquila", label: "Tranquila" },
  { valor: "moderada", label: "Moderada" },
  { valor: "agressiva", label: "Agressiva" },
];

export const DEBOUNCE_BUSCA_MS = 300;
export const STORAGE_PONTO = "rolemoto.feed.ponto";
