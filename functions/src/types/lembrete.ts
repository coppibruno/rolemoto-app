/** 24 h ou 2 h antes do início. A task de 1 h da SPEC 020 não nasce mais. */
export type AntecedenciaLembrete = "24h" | "2h";

export type AlvoLembrete = "role" | "evento";

/** `todos` = uma task do evento, 24 h antes, para quem tem token. */
export type AudienciaLembrete = "pessoa" | "todos";

/** Body da task no Cloud Tasks. */
export type PayloadLembrete = {
  alvo: AlvoLembrete;
  alvoId: string;
  userId: string;
  titulo: string;
  antecedencia: AntecedenciaLembrete;
  audiencia: AudienciaLembrete;
};
