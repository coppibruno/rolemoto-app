import {Router, Request, Response} from "express";
import {responderErro} from "../middleware/errors";
import {param} from "../lib/params";
import {
  idTelemetria,
  podeGravarTelemetria,
  validarBodyTelemetria,
} from "../lib/telemetria-role";
import {
  roleRepository,
  telemetriaRoleRepository,
  usuarioRoleRepository,
} from "../repositories";

/**
 * Telemetria GPS do piloto no rolê.
 *
 * POST /roles/:id/telemetria
 * GET  /roles/:id/telemetria
 */
export const telemetriaRoleRouter = Router();

const uidAutenticado = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

telemetriaRoleRouter.get(
  "/:id/telemetria",
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

      const doc = await telemetriaRoleRepository.buscarPorId(
        idTelemetria(uid, roleId),
      );
      if (!doc) {
        res.status(404).json({erro: "Telemetria não encontrada"});
        return;
      }
      res.json(doc);
    } catch (error) {
      responderErro(res, error);
    }
  },
);

telemetriaRoleRouter.post(
  "/:id/telemetria",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const validado = validarBodyTelemetria(
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

      const pedido = await usuarioRoleRepository.buscarPorUsuarioERole(
        uid,
        roleId,
      );
      if (!podeGravarTelemetria(uid, role, pedido)) {
        res.status(403).json({erro: "somente o comboio grava telemetria"});
        return;
      }

      const criado = await telemetriaRoleRepository.criar({
        usuarioId: uid,
        roleId,
        ...validado.dados,
      });
      if (criado === "conflito") {
        res.status(409).json({erro: "telemetria_ja_existe"});
        return;
      }

      res.status(201).json(criado);
    } catch (error) {
      responderErro(res, error);
    }
  },
);
