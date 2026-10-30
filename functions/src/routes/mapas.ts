import {Router, Request, Response} from "express";
import {mensagemMarco} from "../lib/mapas-google/cota";
import {log} from "../lib/log";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {mapasGoogleRepository} from "../repositories";
import type {ReservaMapaGoogle} from "../repositories/interfaces/mapas-google.repository";

/**
 * Reserva de carga do mapa Google na criação.
 *
 * POST /mapas/carga
 *
 * A resposta só traz o provedor. Período e quantidade ficam no doc
 * `config/mapasGoogle` e no log dos marcos.
 */
export const mapasRouter = Router();

mapasRouter.use(autenticar);
mapasRouter.use(rateLimitAutenticado);

const emitirMarco = (reserva: ReservaMapaGoogle): void => {
  if (!reserva.marco) return;
  try {
    log.warn(
      "MapasGoogle",
      mensagemMarco(reserva.marco, reserva.periodo),
      {periodo: reserva.periodo, cargas: reserva.cargas},
    );
  } catch {
    // A reserva já foi gravada. Falha de log não desfaz.
  }
};

mapasRouter.post("/carga", async (req: Request, res: Response) => {
  try {
    if (!req.usuario?.uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const reserva = await mapasGoogleRepository.reservar();
    emitirMarco(reserva);
    res.json({provedor: reserva.provedor});
  } catch (error) {
    responderErro(res, error);
  }
});
