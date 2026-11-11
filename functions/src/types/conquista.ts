import type {PontoGps} from "../lib/calcular-metricas-telemetria";

/** Pino + círculo que carimba o perfil de quem passa gravando (SPEC 056). */
export type Conquista = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  raioMetros: number;
  ativa: boolean;
  /** Não sai na API. */
  criadorId: string;
  createdAt: string;
  updatedAt: string;
};

/** `GET /conquistas` — cache do aparelho, só ativas. */
export type ConquistaCatalogo = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  raioMetros: number;
};

/** `GET /conquistas/admin`, `POST` e `PATCH`. */
export type ConquistaAdmin = ConquistaCatalogo & {ativa: boolean};

export type ConquistaDados = {
  nome: string;
  lat: number;
  lng: number;
  raioMetros: number;
};

export type ConquistaCreate = ConquistaDados & {criadorId: string};

export type ConquistaUpdate = Partial<ConquistaDados & {ativa: boolean}>;

/** Doc `usersconquista/{usuarioId}_{conquistaId}`. */
export type UsuarioConquista = {
  id: string;
  usuarioId: string;
  conquistaId: string;
  velocidadeMaxKmh: number;
  /** Passeio da máxima atual. Não sai na API. */
  telemetriaId: string;
  primeiraVezEm: string;
  recordeEm: string;
  createdAt: string;
  updatedAt: string;
};

export type PassagemNova = {
  usuarioId: string;
  conquistaId: string;
  velocidadeMaxKmh: number;
  telemetriaId: string;
};

export type NovidadeConquista = "primeira" | "recorde";

/** Item de `conquistas` na resposta 201 do `POST /telemetria`. */
export type ConquistaConcedida = {
  id: string;
  nome: string;
  velocidadeMaxKmh: number;
  novidade: NovidadeConquista;
};

/** `GET /perfil` — só o próprio piloto vê a velocidade. */
export type ConquistaPerfil = {
  id: string;
  nome: string;
  velocidadeMaxKmh: number;
};

/** `GET /usuarios/:uid` — nunca leva a velocidade. */
export type ConquistaPublica = {
  id: string;
  nome: string;
};

/** Recorte do buffer GPS dentro de um círculo, enviado no `POST /telemetria`. */
export type AmostraConquista = {
  conquistaId: string;
  pontos: PontoGps[];
};
