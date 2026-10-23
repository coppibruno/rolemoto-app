import {Router, Request, Response} from "express";
import {responderErro} from "../middleware/errors";
import {carregarHistoricoProprio} from "../lib/carregar-historico";
import {historicoOcultoRepository} from "../repositories";
import type {TipoHistoricoOculto} from "../types/historico-oculto";

/**
 * Histórico de pistas do piloto autenticado.
 *
 * GET  /perfil/historico
 * POST /perfil/historico/ocultar
 */
export const historicoRouter = Router();

const TIPOS_OCULTAR: TipoHistoricoOculto[] = ["role", "evento"];

const tipoOcultarDe = (bruto: unknown): TipoHistoricoOculto | null => {
  if (typeof bruto !== "string") return null;
  if (!TIPOS_OCULTAR.includes(bruto as TipoHistoricoOculto)) return null;
  return bruto as TipoHistoricoOculto;
};

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

historicoRouter.post("/historico/ocultar", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const tipo = tipoOcultarDe(body.tipo);
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!tipo || !id) {
      res.status(400).json({erro: "tipo e id são obrigatórios"});
      return;
    }

    await historicoOcultoRepository.criar({
      usuarioId: uid,
      tipo,
      alvoId: id,
    });
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});
