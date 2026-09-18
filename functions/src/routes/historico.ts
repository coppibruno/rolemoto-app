import {Router, Request, Response} from "express";
import {responderErro} from "../middleware/errors";
import {carregarHistoricoProprio} from "../lib/carregar-historico";

/**
 * Histórico de pistas do piloto autenticado.
 *
 * GET /perfil/historico
 */
export const historicoRouter = Router();

historicoRouter.get("/historico", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    res.json(await carregarHistoricoProprio(uid));
  } catch (error) {
    responderErro(res, error);
  }
});
