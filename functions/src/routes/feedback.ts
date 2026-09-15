import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {escolherPendente} from "../lib/feedback";
import {ePedidoAceito} from "../lib/historico";
import {
  roleRepository,
  usuarioRoleFeedbackRepository,
  usuarioRoleRepository,
} from "../repositories";
import type {Role} from "../types/role";

/**
 * Inbox de avaliação pendente do piloto autenticado.
 *
 * GET /feedback/pendente
 */
export const feedbackRouter = Router();

feedbackRouter.use(autenticar);
feedbackRouter.use(rateLimitAutenticado);

const idFeedback = (usuarioId: string, roleId: string): string =>
  `${usuarioId}_${roleId}`;

feedbackRouter.get("/pendente", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const pedidos = await usuarioRoleRepository.listarPorUsuario(uid);
    const aceitos = pedidos.filter(ePedidoAceito);
    const roleIds = [...new Set(aceitos.map((pedido) => pedido.roleId))];
    const roles = await roleRepository.buscarPorIds(roleIds);

    const rolesPorId = new Map<string, Role>();
    for (const role of roles) {
      rolesPorId.set(role.id, role);
    }

    const docs = await usuarioRoleFeedbackRepository.buscarPorIds(
      roleIds.map((roleId) => idFeedback(uid, roleId)),
    );
    const idsComFeedback = new Set(docs.map((doc) => doc.roleId));

    const role = escolherPendente(aceitos, rolesPorId, idsComFeedback);
    res.json({role});
  } catch (error) {
    responderErro(res, error);
  }
});
