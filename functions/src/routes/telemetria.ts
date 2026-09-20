import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {param} from "../lib/params";
import {
  parseLimiteTelemetria,
  validarBodyRoleTelemetria,
} from "../lib/role-telemetria";
import {roleTelemetriaRepository} from "../repositories";

/**
 * Telemetria GPS de passeio próprio (standalone).
 *
 * POST /telemetria
 * GET  /telemetria
 * GET  /telemetria/:id
 */
export const telemetriaRouter = Router();

telemetriaRouter.use(autenticar);
telemetriaRouter.use(rateLimitAutenticado);

const uidAutenticado = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

telemetriaRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = uidAutenticado(req, res);
    if (!uid) {
      return;
    }

    const validado = validarBodyRoleTelemetria(
      (req.body ?? {}) as Record<string, unknown>,
    );
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }

    const criado = await roleTelemetriaRepository.criar({
      usuarioId: uid,
      ...validado.dados,
    });
    res.status(201).json(criado);
  } catch (error) {
    responderErro(res, error);
  }
});

telemetriaRouter.get("/", async (req: Request, res: Response) => {
  try {
    const uid = uidAutenticado(req, res);
    if (!uid) {
      return;
    }

    const lista = await roleTelemetriaRepository.listarPorUsuario(uid, {
      limite: parseLimiteTelemetria(req.query.limite),
    });
    res.json(lista);
  } catch (error) {
    responderErro(res, error);
  }
});

telemetriaRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const uid = uidAutenticado(req, res);
    if (!uid) {
      return;
    }

    const doc = await roleTelemetriaRepository.buscarPorId(param(req, "id"));
    if (!doc) {
      res.status(404).json({erro: "Telemetria não encontrada"});
      return;
    }
    res.json(doc);
  } catch (error) {
    responderErro(res, error);
  }
});
