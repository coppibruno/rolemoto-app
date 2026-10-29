import {timingSafeEqual} from "crypto";

/** Header `X-Cron-Secret` igual a `STORIES_CRON_SECRET`. Sem valor, recusa. */
export const cronSecretConfere = (recebido: string | undefined): boolean => {
  const esperado = process.env.STORIES_CRON_SECRET ?? "";
  if (!esperado || !recebido) {
    return false;
  }
  const informado = Buffer.from(recebido);
  const guardado = Buffer.from(esperado);
  if (informado.length !== guardado.length) {
    return false;
  }
  return timingSafeEqual(informado, guardado);
};
