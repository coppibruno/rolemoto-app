import {Router, Request, Response} from "express";
import {autenticarCloudTasks} from "../middleware/cloud-tasks-oidc";
import {enviarLembreteAgendado} from "../lib/envio-lembrete";
import {lerPayloadLembrete} from "../lib/lembretes";
import {log, erroDe} from "../lib/log";

export const lembretesRouter = Router();

/**
 * POST /lembretes/enviar
 *
 * Chamado exclusivamente pelo Cloud Tasks (OIDC).
 * Após auth, sempre retorna 2xx para que a task seja consumida.
 * Payload sem antecedência 24h/2h é a task de 1 h — consumida sem push.
 */
lembretesRouter.post(
  "/enviar",
  autenticarCloudTasks,
  async (req: Request, res: Response) => {
    try {
      const lido = lerPayloadLembrete(req.body);
      if (!lido.ok) {
        log.info("Lembrete", "Ignorado", {motivo: lido.motivo});
        res.status(200).json({ignorado: lido.motivo});
        return;
      }

      const resultado = await enviarLembreteAgendado(lido.payload);
      log.info("Lembrete", "Handler concluído", {
        alvo: lido.payload.alvo,
        alvoId: lido.payload.alvoId,
        userId: lido.payload.userId,
        antecedencia: lido.payload.antecedencia,
        ...resultado,
      });
      res.status(200).json(resultado);
    } catch (error) {
      log.error("Lembrete", "Erro no handler", {...erroDe(error)});
      res.status(200).json({erro: "falha no envio, task consumida"});
    }
  },
);
