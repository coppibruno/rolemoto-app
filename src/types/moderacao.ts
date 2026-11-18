export const MOTIVOS_DENUNCIA = [
  "spam",
  "assedio",
  "odio",
  "nudez",
  "violencia",
  "outro",
] as const;

export type MotivoDenuncia = (typeof MOTIVOS_DENUNCIA)[number];

export type AlvoDenuncia =
  | "perfil"
  | "post"
  | "comentario_post"
  | "story"
  | "atividade"
  | "comentario_atividade";

export const ROTULOS_MOTIVO: Record<MotivoDenuncia, string> = {
  spam: "Spam ou golpe",
  assedio: "Assédio ou bullying",
  odio: "Discurso de ódio",
  nudez: "Nudez ou conteúdo sexual",
  violencia: "Violência ou ameaça",
  outro: "Outro",
};

export type ContextoModeracao =
  | "perfil"
  | "post"
  | "comentario"
  | "story"
  | "atividade";

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

export type RespostaBloqueio = {
  bloqueado: boolean;
  novo?: boolean;
};

export type RespostaDenuncia = {
  novo: boolean;
  id?: string;
};

export const rotuloDenunciar = (contexto: ContextoModeracao): string => {
  switch (contexto) {
    case "perfil":
      return "Denunciar perfil";
    case "post":
      return "Denunciar foto";
    case "comentario":
      return "Denunciar comentário";
    case "story":
      return "Denunciar story";
    default:
      return "Denunciar";
  }
};

export const alvoTipoDoContexto = (
  contexto: ContextoModeracao,
): AlvoDenuncia => {
  switch (contexto) {
    case "perfil":
      return "perfil";
    case "post":
      return "post";
    case "comentario":
      return "comentario_post";
    case "story":
      return "story";
    case "atividade":
      return "atividade";
  }
};
