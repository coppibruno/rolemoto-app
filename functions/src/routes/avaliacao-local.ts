import {Router, Request, Response} from "express";
import {
  hidratarAvaliacaoLocal,
  validarBodyAvaliacao,
} from "../lib/avaliacao-experiencia";
import {param} from "../lib/params";
import {responderErro} from "../middleware/errors";
import {
  localRepository,
  usuarioLocalFeedbackRepository,
  usuarioRepository,
} from "../repositories";

/**
 * Avaliações de locais oficiais.
 *
 * GET  /locais/:id/avaliacoes
 * GET  /locais/:id/avaliacao
 * POST /locais/:id/avaliacoes
 */
export const avaliacaoLocalRouter = Router();

const uidAutenticado = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

avaliacaoLocalRouter.get(
  "/:id/avaliacoes",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const localId = param(req, "id");
      const local = await localRepository.buscarPorId(localId);
      if (!local) {
        res.status(404).json({erro: "Local não encontrado"});
        return;
      }

      const docs = await usuarioLocalFeedbackRepository.listarPorLocal(localId);
      const usuarios = await usuarioRepository.buscarPorIds(
        docs.map((doc) => doc.usuarioId),
      );
      const porUid = new Map(usuarios.map((usuario) => [usuario.uid, usuario]));
      res.json(
        docs.map((doc) =>
          hidratarAvaliacaoLocal(doc, porUid.get(doc.usuarioId)),
        ),
      );
    } catch (error) {
      responderErro(res, error);
    }
  },
);

avaliacaoLocalRouter.get(
  "/:id/avaliacao",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const localId = param(req, "id");
      const doc = await usuarioLocalFeedbackRepository.buscarPorUsuarioELocal(
        uid,
        localId,
      );
      if (!doc) {
        res.status(404).json({erro: "Avaliação não encontrada"});
        return;
      }

      const usuario = await usuarioRepository.buscarPorId(uid);
      res.json(hidratarAvaliacaoLocal(doc, usuario ?? undefined));
    } catch (error) {
      responderErro(res, error);
    }
  },
);

avaliacaoLocalRouter.post(
  "/:id/avaliacoes",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const validado = validarBodyAvaliacao(
        (req.body ?? {}) as Record<string, unknown>,
      );
      if (!validado.ok) {
        res.status(400).json({erro: validado.erro});
        return;
      }

      const localId = param(req, "id");
      const local = await localRepository.buscarPorId(localId);
      if (!local) {
        res.status(404).json({erro: "Local não encontrado"});
        return;
      }

      const criado = await usuarioLocalFeedbackRepository.criar({
        usuarioId: uid,
        alvoId: localId,
        nota: validado.dados.nota,
        comentario: validado.dados.comentario,
        fotosUrls: validado.dados.fotosUrls,
        recomendaComboio: validado.dados.recomendaComboio,
      });
      if (criado === "conflito") {
        res.status(409).json({erro: "você já avaliou"});
        return;
      }

      const usuario = await usuarioRepository.buscarPorId(uid);
      res.status(201).json(hidratarAvaliacaoLocal(criado, usuario ?? undefined));
    } catch (error) {
      responderErro(res, error);
    }
  },
);
