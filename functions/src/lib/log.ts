import {logger} from "firebase-functions";

/** Logs estruturados para Cloud Logging. Não incluir tokens, senhas ou e-mails. */
export const log = {
  info(area: string, mensagem: string, dados: Record<string, unknown> = {}): void {
    logger.info(`[${area}] ${mensagem}`, dados);
  },

  warn(area: string, mensagem: string, dados: Record<string, unknown> = {}): void {
    logger.warn(`[${area}] ${mensagem}`, dados);
  },

  error(area: string, mensagem: string, dados: Record<string, unknown> = {}): void {
    logger.error(`[${area}] ${mensagem}`, dados);
  },
};

export const erroDe = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {mensagem: error.message, nome: error.name};
  }
  return {detalhe: String(error)};
};
