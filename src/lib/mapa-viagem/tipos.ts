import type { Localizacao } from "@/types/role";

export type PontoNomeado = { nome: string; lat: number; lng: number };

/** `Directory.Data/mapas/{roleId}/meta.json` — mesmo formato lido pela página sem internet. */
export type MetaPacote = {
  roleId: string;
  titulo: string;
  dataHoraSaida: string;
  pontos: Localizacao[];
  pontosHash: string;
  baixadoEm: string;
  bytes: number;
  postos: PontoNomeado[];
  cidades: PontoNomeado[];
  atribuicao: "© OpenStreetMap";
};

export type EstadoPacote =
  | { tipo: "indisponivel" }
  | { tipo: "sem-url" }
  | { tipo: "carregando" }
  | { tipo: "ausente" }
  | { tipo: "baixando"; fracao: number }
  | { tipo: "atual"; meta: MetaPacote }
  | { tipo: "desatualizado"; meta: MetaPacote };
