import {Router, Request, Response} from "express";
import {param} from "../lib/params";
import {registrarCheckin, validarBodyCheckin} from "../lib/checkin-local";
import {responderErro} from "../middleware/errors";
import {localRepository} from "../repositories";

/**
 * Check-in GPS em local oficial.
 *
 * POST /locais/:id/checkin
 */
export const checkinLocalRouter = Router();

checkinLocalRouter.post(
  "/:id/checkin",
  async (req: Request, res: Response) => {
    try {
      const uid = req.usuario?.uid;
      if (!uid) {
        res.status(401).json({erro: "Não autenticado"});
        return;
      }

      const validado = validarBodyCheckin(req.body);
      if (!validado.ok) {
        res.status(400).json({erro: validado.erro});
        return;
      }

      const local = await localRepository.buscarPorId(param(req, "id"));
      if (!local) {
        res.status(404).json({erro: "Local não encontrado"});
        return;
      }

      const resultado = await registrarCheckin(uid, local, validado.dados);
      if (!resultado.ok) {
        res.status(resultado.status).json({erro: resultado.erro});
        return;
      }

      res.status(201).json(resultado.resposta);
    } catch (error) {
      responderErro(res, error);
    }
  },
);
