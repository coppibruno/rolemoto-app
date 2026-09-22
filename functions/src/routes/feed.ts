import { Router, Request, Response } from "express";
import { autenticar } from "../middleware/auth";
import { responderErro } from "../middleware/errors";
import { rateLimitAutenticado } from "../middleware/rate-limit";
import {
  contarRolesFeed,
  filtrarEventosFeed,
  filtrarLocaisFeed,
  roleIdsComVinculoUsuario,
} from "../lib/feed-filtros";
import { validarQueryRoles } from "../lib/roles-query";
import { resolverIntervaloQuando } from "../lib/quando";
import {
  eventoRepository,
  localRepository,
  roleRepository,
  usuarioRoleRepository,
} from "../repositories";
import type { ContagensFeed } from "../types/feed";

/**
 * Contagens leves do feed (sem payloads de card).
 *
 * GET /feed/contagens
 */
export const feedRouter = Router();

feedRouter.use(autenticar);
feedRouter.use(rateLimitAutenticado);

feedRouter.get("/contagens", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({ erro: "Não autenticado" });
      return;
    }

    const query = validarQueryRoles(req);
    if ("erro" in query) {
      res.status(query.status).json({ erro: query.erro });
      return;
    }

    const intervalo = resolverIntervaloQuando(query.quando, query.data);
    const origem = {
      lat: query.lat,
      lng: query.lng,
      raioKm: query.raioKm,
    };

    const [roles, eventos, locais, pedidosUsuario] = await Promise.all([
      roleRepository.listar({
        dataInicioIso: intervalo.dataInicioIso,
        dataFimIso: intervalo.dataFimIso,
        ritmo: query.ritmo,
      }),
      eventoRepository.listarFuturos({
        dataInicioIso: intervalo.dataInicioIso,
        dataFimIso: intervalo.dataFimIso,
      }),
      localRepository.listar(),
      usuarioRoleRepository.listarPorUsuario(uid),
    ]);

    const vinculos = roleIdsComVinculoUsuario(pedidosUsuario);
    const contagens: ContagensFeed = {
      roles: contarRolesFeed(roles, origem, uid, vinculos, query.q),
      eventos: filtrarEventosFeed(eventos, origem, query.q).length,
      locais: filtrarLocaisFeed(locais, origem, query.q).length,
    };

    res.json(contagens);
  } catch (error) {
    responderErro(res, error);
  }
});
