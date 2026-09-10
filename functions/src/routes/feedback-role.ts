import {Router, Request, Response} from "express";
import {responderErro} from "../middleware/errors";
import {param} from "../lib/params";
import {
  eDoComboio,
  hidratarFeedback,
  saidaPassou,
  validarBodyFeedback,
} from "../lib/feedback";
import {ePedidoAceito} from "../lib/historico";
import {
  roleRepository,
  usuarioRepository,
  usuarioRoleFeedbackRepository,
  usuarioRoleRepository,
} from "../repositories";

/**
 * Relatos do comboio no rolê.
 *
 * GET  /roles/:id/feedbacks
 * POST /roles/:id/feedback
 */
export const feedbackRoleRouter = Router();

const uidAutenticado = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

feedbackRoleRouter.get(
  "/:id/feedbacks",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const roleId = param(req, "id");
      const role = await roleRepository.buscarPorId(roleId);
      if (!role) {
        res.status(404).json({erro: "Rolê não encontrado"});
        return;
      }

      const pedido = await usuarioRoleRepository.buscarPorUsuarioERole(
        uid,
        roleId,
      );
      if (!eDoComboio(uid, role, pedido)) {
        res.status(403).json({erro: "somente o comboio lê os relatos"});
        return;
      }

      const docs = await usuarioRoleFeedbackRepository.listarPorRole(roleId);
      const usuarios = await usuarioRepository.buscarPorIds(
        docs.map((doc) => doc.usuarioId),
      );
      const porUid = new Map(usuarios.map((usuario) => [usuario.uid, usuario]));
      const itens = docs.map((doc) =>
        hidratarFeedback(doc, porUid.get(doc.usuarioId)),
      );
      res.json(itens);
    } catch (error) {
      responderErro(res, error);
    }
  },
);

feedbackRoleRouter.post(
  "/:id/feedback",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const validado = validarBodyFeedback(
        (req.body ?? {}) as Record<string, unknown>,
      );
      if (!validado.ok) {
        res.status(400).json({erro: validado.erro});
        return;
      }

      const roleId = param(req, "id");
      const role = await roleRepository.buscarPorId(roleId);
      if (!role) {
        res.status(404).json({erro: "Rolê não encontrado"});
        return;
      }
      if (!saidaPassou(role.dataHoraSaida)) {
        res.status(400).json({erro: "este rolê ainda não aconteceu"});
        return;
      }
      if (role.criadorId === uid) {
        res.status(403).json({erro: "o organizador não avalia o próprio rolê"});
        return;
      }

      const pedido = await usuarioRoleRepository.buscarPorUsuarioERole(
        uid,
        roleId,
      );
      if (!pedido || !ePedidoAceito(pedido)) {
        res.status(403).json({erro: "somente o comboio confirma avalia"});
        return;
      }

      const criado = await usuarioRoleFeedbackRepository.criar({
        usuarioId: uid,
        roleId,
        nota: validado.dados.nota,
        tags: validado.dados.tags,
        comentario: validado.dados.comentario,
      });
      if (criado === "conflito") {
        res.status(409).json({erro: "você já avaliou este rolê"});
        return;
      }

      const usuario = await usuarioRepository.buscarPorId(uid);
      res.status(201).json(hidratarFeedback(criado, usuario ?? undefined));
    } catch (error) {
      responderErro(res, error);
    }
  },
);
