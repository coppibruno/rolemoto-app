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
import {escolherUmaPorSerie} from "../lib/serie-evento";
import { validarQueryRoles } from "../lib/roles-query";
import { resolverIntervaloQuando } from "../lib/quando";
import {
  atividadeRepository,
  eventoRepository,
  localRepository,
  roleRepository,
  seguirRepository,
  usuarioRoleRepository,
} from "../repositories";
import {lotesDeAutores, mesclarPaginas} from "../lib/atividade";
import {montarItens, removerSumidas} from "../lib/atividade-publica";
import {
  LIMITE_NOVIDADES,
  LIMITE_PAGINA_FEED_AMIGOS,
  MAX_AUTORES_FEED,
} from "../types/atividade";
import type {PaginaFeedAmigos} from "../types/atividade";
import type { ContagensFeed } from "../types/feed";

/**
 * Contagens leves do feed (sem payloads de card) e o Início.
 *
 * GET /feed/contagens
 * GET /feed/amigos?cursor=
 * GET /feed/amigos/novidades?desde=
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
      eventos: escolherUmaPorSerie(
        filtrarEventosFeed(eventos, origem, query.q),
        new Date(),
      ).length,
      locais: filtrarLocaisFeed(locais, origem, query.q).length,
    };

    res.json(contagens);
  } catch (error) {
    responderErro(res, error);
  }
});

const lotesDoToken = async (uid: string): Promise<string[][]> =>
  lotesDeAutores(uid, await seguirRepository.listarSeguidosRecentes(uid, MAX_AUTORES_FEED - 1));

const textoDaQuery = (valor: unknown): string | null =>
  typeof valor === "string" && valor.trim() ? valor.trim() : null;

feedRouter.get("/amigos", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid as string;
    const cursor = textoDaQuery(req.query.cursor);
    const pagina = await atividadeRepository.paginaPorAutores(
      await lotesDoToken(uid),
      cursor,
      LIMITE_PAGINA_FEED_AMIGOS + 1,
    );
    if (!pagina.ok) {
      res.status(400).json({ erro: "cursor inválido" });
      return;
    }
    const { itens: brutos, temMais } = mesclarPaginas(pagina.listas, LIMITE_PAGINA_FEED_AMIGOS);
    const ultimo = brutos[brutos.length - 1];
    const proximoCursor = temMais && ultimo ? ultimo.id : null;
    const { itens, sumidas } = await montarItens(brutos, uid, true);
    removerSumidas(sumidas.filter((id) => id !== proximoCursor));
    const resposta: PaginaFeedAmigos = { itens, proximoCursor };
    res.json(resposta);
  } catch (error) {
    responderErro(res, error);
  }
});

feedRouter.get("/amigos/novidades", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid as string;
    const desde = textoDaQuery(req.query.desde);
    if (!desde) {
      res.json({ total: 0 });
      return;
    }
    const total = await atividadeRepository.contarNovidades(
      await lotesDoToken(uid),
      desde,
      LIMITE_NOVIDADES,
    );
    res.json({ total });
  } catch (error) {
    responderErro(res, error);
  }
});
