import {Router, Request, Response} from "express";
import {responderErro} from "../middleware/errors";
import {log} from "../lib/log";
import {param} from "../lib/params";
import {
  roleRepository,
  usuarioRoleRepository,
} from "../repositories";
import {cancelarLembrete} from "../lib/lembretes";
import {notificarPedidoVaga} from "../lib/notificacoes";
import type {UsuarioRole} from "../types/usuario-role";

/**
 * REST de participação no rolê (coleção `usersrole`).
 *
 * GET    /roles/:id/participacao
 * POST   /roles/:id/participacao
 * PATCH  /roles/:id/participacao
 * DELETE /roles/:id/participacao
 */
export const participacaoRouter = Router();

const idPedido = (usuarioId: string, roleId: string): string =>
  `${usuarioId}_${roleId}`;

const estaRecusado = (pedido: UsuarioRole): boolean =>
  pedido.recusadoEm !== null;

const uidAutenticado = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

participacaoRouter.get(
  "/:id/participacao",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const roleId = param(req, "id");
      const pedido = await usuarioRoleRepository.buscarPorUsuarioERole(
        uid,
        roleId,
      );
      if (!pedido) {
        res.status(404).json({erro: "Participação não encontrada"});
        return;
      }
      res.json(pedido);
    } catch (error) {
      responderErro(res, error);
    }
  },
);

participacaoRouter.post(
  "/:id/participacao",
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
      if (role.criadorId === uid) {
        res.status(403).json({
          erro: "O organizador não solicita vaga no próprio rolê",
        });
        return;
      }
      if (Date.parse(role.dataHoraSaida) <= Date.now()) {
        res.status(400).json({erro: "este rolê já aconteceu"});
        return;
      }

      const existente = await usuarioRoleRepository.buscarPorUsuarioERole(
        uid,
        roleId,
      );
      if (existente) {
        if (estaRecusado(existente)) {
          res.status(409).json({erro: "solicitação recusada"});
          return;
        }
        res.json(existente);
        return;
      }

      const criado = await usuarioRoleRepository.criar({
        usuarioId: uid,
        roleId,
        criadorId: role.criadorId,
      });
      log.info("Participacao", "Solicitação criada", {
        roleId,
        usuarioId: uid,
        criadorId: role.criadorId,
      });
      await notificarPedidoVaga(role.criadorId, role.id, role.titulo);
      res.status(201).json(criado);
    } catch (error) {
      responderErro(res, error);
    }
  },
);

participacaoRouter.patch(
  "/:id/participacao",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const notificar = (req.body ?? {}).notificar;
      if (typeof notificar !== "boolean") {
        res.status(400).json({erro: "notificar é obrigatório"});
        return;
      }

      const roleId = param(req, "id");
      const pedido = await usuarioRoleRepository.buscarPorUsuarioERole(
        uid,
        roleId,
      );
      if (!pedido) {
        res.status(404).json({erro: "Participação não encontrada"});
        return;
      }
      if (estaRecusado(pedido)) {
        res.status(409).json({erro: "solicitação recusada"});
        return;
      }

      const atualizado = await usuarioRoleRepository.atualizarNotificar(
        idPedido(uid, roleId),
        {notificar},
      );
      log.info("Participacao", "Preferência de notificação atualizada", {
        roleId,
        usuarioId: uid,
        notificar,
      });
      res.json(atualizado);
    } catch (error) {
      responderErro(res, error);
    }
  },
);

participacaoRouter.delete(
  "/:id/participacao",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const roleId = param(req, "id");
      await usuarioRoleRepository.remover(idPedido(uid, roleId));
      await cancelarLembrete(roleId, uid);
      log.info("Participacao", "Solicitação removida", {roleId, usuarioId: uid});
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
);
