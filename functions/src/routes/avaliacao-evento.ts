import {Router, Request, Response} from "express";
import {
  eventoEncerrouParaAvaliacao,
  hidratarAvaliacaoEvento,
  validarBodyAvaliacao,
} from "../lib/avaliacao-experiencia";
import {param} from "../lib/params";
import {responderErro} from "../middleware/errors";
import {
  eventoRepository,
  usuarioEventoFeedbackRepository,
  usuarioEventoRepository,
  usuarioRepository,
} from "../repositories";

/**
 * Avaliações de eventos.
 *
 * GET  /eventos/:id/avaliacoes
 * GET  /eventos/:id/avaliacao
 * POST /eventos/:id/avaliacoes
 */
export const avaliacaoEventoRouter = Router();

const uidAutenticado = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

avaliacaoEventoRouter.get(
  "/:id/avaliacoes",
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

      const docs =
        await usuarioEventoFeedbackRepository.listarPorEvento(eventoId);
      const usuarios = await usuarioRepository.buscarPorIds(
        docs.map((doc) => doc.usuarioId),
      );
      const porUid = new Map(usuarios.map((usuario) => [usuario.uid, usuario]));
      res.json(
        docs.map((doc) =>
          hidratarAvaliacaoEvento(doc, porUid.get(doc.usuarioId)),
        ),
      );
    } catch (error) {
      responderErro(res, error);
    }
  },
);

avaliacaoEventoRouter.get(
  "/:id/avaliacao",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const eventoId = param(req, "id");
      const doc =
        await usuarioEventoFeedbackRepository.buscarPorUsuarioEEvento(
          uid,
          eventoId,
        );
      if (!doc) {
        res.status(404).json({erro: "Avaliação não encontrada"});
        return;
      }

      const usuario = await usuarioRepository.buscarPorId(uid);
      res.json(hidratarAvaliacaoEvento(doc, usuario ?? undefined));
    } catch (error) {
      responderErro(res, error);
    }
  },
);

avaliacaoEventoRouter.post(
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

      const eventoId = param(req, "id");
      const evento = await eventoRepository.buscarPorId(eventoId);
      if (!evento) {
        res.status(404).json({erro: "Evento não encontrado"});
        return;
      }

      const inscricao = await usuarioEventoRepository.buscarPorUsuarioEEvento(
        uid,
        eventoId,
      );
      if (!inscricao) {
        res.status(403).json({erro: "somente inscritos avaliam"});
        return;
      }
      if (!eventoEncerrouParaAvaliacao(evento)) {
        res.status(400).json({erro: "este evento ainda não encerrou"});
        return;
      }

      const criado = await usuarioEventoFeedbackRepository.criar({
        usuarioId: uid,
        alvoId: eventoId,
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
      res
        .status(201)
        .json(hidratarAvaliacaoEvento(criado, usuario ?? undefined));
    } catch (error) {
      responderErro(res, error);
    }
  },
);
