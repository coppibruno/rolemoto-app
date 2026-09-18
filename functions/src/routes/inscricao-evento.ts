import {Router, Request, Response} from "express";
import {responderErro} from "../middleware/errors";
import {log} from "../lib/log";
import {param} from "../lib/params";
import {
  eventoRepository,
  usuarioEventoRepository,
} from "../repositories";
import type {Evento} from "../types/evento";

/**
 * REST de inscrição em evento (coleção `usersevento`).
 *
 * GET    /eventos/:id/inscricao
 * POST   /eventos/:id/inscricao
 * DELETE /eventos/:id/inscricao
 */
export const inscricaoEventoRouter = Router();

const idInscricao = (usuarioId: string, eventoId: string): string =>
  `${usuarioId}_${eventoId}`;

const uidAutenticado = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

/** Evento ainda aceita inscrição se now <= (encerramento ?? abertura). */
export const eventoAindaAberto = (evento: Evento): boolean => {
  const limiteIso = evento.dataHoraEncerramento ?? evento.dataHoraAbertura;
  return Date.parse(limiteIso) >= Date.now();
};

inscricaoEventoRouter.get(
  "/:id/inscricao",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const eventoId = param(req, "id");
      const inscricao = await usuarioEventoRepository.buscarPorUsuarioEEvento(
        uid,
        eventoId,
      );
      if (!inscricao) {
        res.status(404).json({erro: "Inscrição não encontrada"});
        return;
      }
      res.json(inscricao);
    } catch (error) {
      responderErro(res, error);
    }
  },
);

inscricaoEventoRouter.post(
  "/:id/inscricao",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const eventoId = param(req, "id");
      const evento = await eventoRepository.buscarPorId(eventoId);
      if (!evento) {
        res.status(404).json({erro: "Evento não encontrado"});
        return;
      }
      if (!eventoAindaAberto(evento)) {
        res.status(400).json({erro: "este evento já encerrou"});
        return;
      }

      const existente = await usuarioEventoRepository.buscarPorUsuarioEEvento(
        uid,
        eventoId,
      );
      if (existente) {
        res.json(existente);
        return;
      }

      const criado = await usuarioEventoRepository.criar({
        usuarioId: uid,
        eventoId,
        criadorId: evento.criadorId,
      });
      log.info("InscricaoEvento", "Inscrição criada", {
        eventoId,
        usuarioId: uid,
        criadorId: evento.criadorId,
      });
      res.status(201).json(criado);
    } catch (error) {
      responderErro(res, error);
    }
  },
);

inscricaoEventoRouter.delete(
  "/:id/inscricao",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const eventoId = param(req, "id");
      await usuarioEventoRepository.remover(idInscricao(uid, eventoId));
      log.info("InscricaoEvento", "Inscrição removida", {
        eventoId,
        usuarioId: uid,
      });
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
);
