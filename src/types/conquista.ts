import type { PontoGps } from "@/lib/telemetria/calcular-metricas";

/** Item de `GET /conquistas` — o que o aparelho guarda no cache. */
export type ConquistaCatalogo = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  raioMetros: number;
};

/** Item de `GET /conquistas/admin`, `POST` e `PATCH`. */
export type ConquistaAdmin = ConquistaCatalogo & { ativa: boolean };

export type ConquistaDados = {
  nome: string;
  lat: number;
  lng: number;
  raioMetros: number;
};

/** Chip do perfil. `velocidadeMaxKmh` só vem no `GET /perfil` (o próprio piloto). */
export type ConquistaPerfil = {
  id: string;
  nome: string;
  velocidadeMaxKmh?: number;
};

/** Item de `conquistas` no 201 do `POST /telemetria`. */
export type ConquistaConcedida = {
  id: string;
  nome: string;
  velocidadeMaxKmh: number;
  novidade: "primeira" | "recorde";
};

export type NovidadeMedalha = "primeira" | "recorde" | "passagem";

/** Item de `medalhas` no `GET /telemetria/:id`. A velocidade só vem para o dono. */
export type MedalhaTelemetria = {
  conquistaId: string;
  nome: string;
  lat: number;
  lng: number;
  velocidadeMaxKmh?: number;
  novidade: NovidadeMedalha;
};

/** Linha de `GET /conquistas/:id/ranking`. */
export type ItemRanking = {
  posicao: number | null;
  uid: string;
  apelido: string;
  fotoUrl: string;
  velocidadeMaxKmh: number | null;
  eu: boolean;
};

export type RankingConquista = {
  conquista: { id: string; nome: string };
  teto: number;
  itens: ItemRanking[];
};

/** Recorte do buffer dentro de um círculo, enviado no `POST /telemetria`. */
export type AmostraConquista = {
  conquistaId: string;
  pontos: PontoGps[];
};
