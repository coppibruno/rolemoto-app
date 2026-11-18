export const LIMITE_PAGINA_BLOQUEIOS = 30;
export const LIMITE_DETALHES_DENUNCIA = 280;
export const JANELA_DEDUPE_DENUNCIA_MS = 24 * 60 * 60 * 1000;

export const MOTIVOS_DENUNCIA = [
  "spam",
  "assedio",
  "odio",
  "nudez",
  "violencia",
  "outro",
] as const;

export type MotivoDenuncia = (typeof MOTIVOS_DENUNCIA)[number];

export const ALVOS_DENUNCIA = [
  "perfil",
  "post",
  "comentario_post",
  "story",
  "atividade",
  "comentario_atividade",
] as const;

export type AlvoDenuncia = (typeof ALVOS_DENUNCIA)[number];

export type StatusDenuncia = "aberta" | "resolvida";

export type VinculoBloqueio = {
  id: string;
  bloqueadorId: string;
  bloqueadoId: string;
  createdAt: string;
};

export type LinhaBloqueio = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  bloqueadoEm: string;
};

export type PaginaBloqueios = {
  itens: LinhaBloqueio[];
  proximoCursor: string | null;
};

export type Denuncia = {
  id: string;
  denuncianteId: string;
  alvoTipo: AlvoDenuncia;
  alvoId: string;
  acusadoId: string;
  motivo: MotivoDenuncia;
  detalhes: string;
  status: StatusDenuncia;
  createdAt: string;
};

export type DenunciaCreate = {
  denuncianteId: string;
  alvoTipo: AlvoDenuncia;
  alvoId: string;
  acusadoId: string;
  motivo: MotivoDenuncia;
  detalhes: string;
};

export type ResultadoBloquear =
  | "criado"
  | "existente"
  | "alvo_ausente"
  | "bloqueador_ausente";

export type ResultadoDesbloquear = "removido" | "ausente";

export type ResultadoDenunciar =
  | {tipo: "criada"; id: string}
  | {tipo: "duplicada"};
