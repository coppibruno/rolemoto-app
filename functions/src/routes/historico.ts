import {Router, Request, Response} from "express";
import {responderErro} from "../middleware/errors";
import {coletarIdsRolesHistorico, montarHistorico} from "../lib/historico";
import {roleRepository, usuarioRoleRepository} from "../repositories";
import type {Role} from "../types/role";

/**
 * Histórico de pistas do piloto autenticado.
 *
 * GET /perfil/historico
 */
export const historicoRouter = Router();

historicoRouter.get("/historico", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const [pedidos, criados] = await Promise.all([
      usuarioRoleRepository.listarPorUsuario(uid),
      roleRepository.listarPorCriador(uid),
    ]);

    const idsPedidos = [...new Set(pedidos.map((pedido) => pedido.roleId))];
    const rolesPedidos = await roleRepository.buscarPorIds(idsPedidos);

    const rolesPorId = new Map<string, Role>();
    for (const role of rolesPedidos) {
      rolesPorId.set(role.id, role);
    }
    for (const criado of criados) {
      rolesPorId.set(criado.id, criado);
    }

    const idsContagem = coletarIdsRolesHistorico(pedidos, criados, rolesPorId);
    const confirmadosPorRole = new Map<string, number>();
    await Promise.all(
      idsContagem.map(async (id) => {
        const n = await usuarioRoleRepository.contarConfirmados(id);
        confirmadosPorRole.set(id, n);
      }),
    );

    res.json(montarHistorico(pedidos, criados, rolesPorId, confirmadosPorRole));
  } catch (error) {
    responderErro(res, error);
  }
});
