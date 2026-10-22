import {timingSafeEqual} from "crypto";
import {Router, Request, Response} from "express";
import {expirarStoriesLote} from "../lib/story-local";
import {responderErro} from "../middleware/errors";

/**
 * Limpeza diária. Cloud Scheduler 04:00 America/Sao_Paulo:
 * POST {FUNCTIONS_BASE_URL}/interno/stories/expirar
 * Header X-Cron-Secret = STORIES_CRON_SECRET
 *
 * Sem o header certo a rota responde 404. O emulator não dispara o Scheduler;
 * o GET de stories já esconde o que expirou.
 */
export const internoRouter = Router();

const segredoConfere = (recebido: string | undefined): boolean => {
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

internoRouter.post("/stories/expirar", async (req: Request, res: Response) => {
  if (!segredoConfere(req.get("x-cron-secret"))) {
    res.status(404).json({erro: "Não encontrado"});
    return;
  }
  try {
    const apagados = await expirarStoriesLote();
    res.json({apagados});
  } catch (error) {
    responderErro(res, error);
  }
});
