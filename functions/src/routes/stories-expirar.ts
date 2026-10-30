import {Router, Request, Response} from "express";
import {cronSecretConfere} from "../lib/cron-secret";
import {expirarStoriesLote} from "../lib/story-local";
import {responderErro} from "../middleware/errors";
import {responderBuscaSugestoes} from "./sugestoes-locais";
import {responderBuscaEventos} from "./sugestoes-eventos";

/**
 * Limpeza diária. Cloud Scheduler 04:00 America/Sao_Paulo:
 * POST {FUNCTIONS_BASE_URL}/interno/stories/expirar
 * Header X-Cron-Secret = STORIES_CRON_SECRET
 *
 * Sem o header certo a rota responde 404. O emulator não dispara o Scheduler;
 * o GET de stories já esconde o que expirou.
 */
export const internoRouter = Router();

internoRouter.post("/stories/expirar", async (req: Request, res: Response) => {
  if (!cronSecretConfere(req.get("x-cron-secret"))) {
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

internoRouter.post("/sugestoes-locais/buscar", async (req: Request, res: Response) => {
  if (!cronSecretConfere(req.get("x-cron-secret"))) {
    res.status(404).json({erro: "Não encontrado"});
    return;
  }
  await responderBuscaSugestoes(res);
});

internoRouter.post("/sugestoes-eventos/buscar", async (req: Request, res: Response) => {
  if (!cronSecretConfere(req.get("x-cron-secret"))) {
    res.status(404).json({erro: "Não encontrado"});
    return;
  }
  await responderBuscaEventos(res);
});
