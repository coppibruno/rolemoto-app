import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {
  classificarMeusRoles,
  destaquesDe,
  montarContagens,
  montarPayloadMeusRoles,
  montarTelemetria,
  ordenarPayload,
  paraMeuRoleItem,
  TETO_MEUS_ROLES,
  unirComCriados,
} from "../lib/meus-roles";
import {
  roleRepository,
  usuarioRepository,
  usuarioRoleRepository,
} from "../repositories";
import type {Role} from "../types/role";
import type {Usuario} from "../types/usuario";

/**
 * Garagem do piloto autenticado.
 *
 * GET /meus-roles
 */
export const meusRolesRouter = Router();

meusRolesRouter.use(autenticar);
meusRolesRouter.use(rateLimitAutenticado);

const LIMITE_DESTAQUES = 3;

meusRolesRouter.get("/", async (req: Request, res: Response) => {
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

    const classificados = unirComCriados(
      classificarMeusRoles(uid, pedidos, rolesPorId),
      criados,
    );
    const telemetria = montarTelemetria(classificados);
    const contagens = montarContagens(classificados);
    const recorte = ordenarPayload(classificados).slice(0, TETO_MEUS_ROLES);

    const extras = await Promise.all(
      recorte.map(async (item) => {
        const [confirmados, vinculos] = await Promise.all([
          usuarioRoleRepository.contarConfirmados(item.role.id),
          usuarioRoleRepository.listarConfirmadosDoRole(
            item.role.id,
            LIMITE_DESTAQUES,
          ),
        ]);
        return {item, confirmados, vinculos};
      }),
    );

    const uids = new Set<string>();
    for (const extra of extras) {
      uids.add(extra.item.role.criadorId);
      for (const vinculo of extra.vinculos) {
        uids.add(vinculo.usuarioId);
      }
    }
    const usuarios = await usuarioRepository.buscarPorIds([...uids]);
    const usuariosPorId = new Map<string, Usuario>(
      usuarios.map((usuario) => [usuario.uid, usuario]),
    );

    const itens = extras.map(({item, confirmados, vinculos}) =>
      paraMeuRoleItem(
        item,
        confirmados,
        destaquesDe(vinculos, usuariosPorId),
        usuariosPorId,
      ),
    );

    res.json(montarPayloadMeusRoles(itens, telemetria, contagens));
  } catch (error) {
    responderErro(res, error);
  }
});
