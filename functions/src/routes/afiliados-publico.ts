import {Router, Request, Response} from "express";
import {responderErro} from "../middleware/errors";
import {rateLimit} from "../middleware/rate-limit";
import {codigoAfiliado} from "../lib/afiliado";
import {param} from "../lib/params";
import {afiliadoRepository} from "../repositories";

/**
 * Clique na página `/i/{codigo}` — sem token. O front chama uma vez por
 * navegador por dia.
 *
 * POST /publico/afiliados/:codigo/clique
 */
export const afiliadosPublicoRouter = Router();

afiliadosPublicoRouter.use(rateLimit({nome: "publico-afiliados", max: 30}));

afiliadosPublicoRouter.post("/:codigo/clique", async (req: Request, res: Response) => {
  try {
    const codigo = codigoAfiliado(param(req, "codigo"));
    const contou = codigo ? await afiliadoRepository.registrarClique(codigo) : false;
    if (!contou) {
      res.status(404).json({erro: "Este link não existe"});
      return;
    }
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});
