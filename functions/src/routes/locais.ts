import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {exigirAdmin} from "../middleware/exigir-admin";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {filtrarLocaisFeed} from "../lib/feed-filtros";
import {validarQueryGeoOpcional} from "../lib/feed-query";
import {erroDe, log} from "../lib/log";
import {param} from "../lib/params";
import {buscarPontoProximo} from "../lib/ponto-proximo";
import {validarPublicacaoLocal} from "../lib/validar-local";
import {
  localRepository,
  usuarioLocalFavoritoRepository,
  usuarioLocalFeedbackRepository,
  usuarioRepository,
} from "../repositories";
import {detalheStoriesLocal} from "../lib/story-local";
import {avaliacaoLocalRouter} from "./avaliacao-local";
import {checkinLocalRouter} from "./checkin-local";
import {favoritoLocalRouter} from "./favorito-local";
import {storiesLocalRouter} from "./stories-local";

/**
 * REST de locais oficiais (pontos permanentes).
 *
 * GET    /locais
 * GET    /locais/proximo
 * GET    /locais/:id
 * POST   /locais   (admin do documento users)
 * GET|POST /locais/:id/avaliacoes
 * GET    /locais/:id/avaliacao
 * POST|DELETE /locais/:id/favorito
 * POST   /locais/:id/checkin
 */
export const locaisRouter = Router();

locaisRouter.use(autenticar);
locaisRouter.use(rateLimitAutenticado);
locaisRouter.use(avaliacaoLocalRouter);
locaisRouter.use(checkinLocalRouter);
locaisRouter.use(favoritoLocalRouter);
locaisRouter.use(storiesLocalRouter);

const idFeedbackLocal = (usuarioId: string, localId: string): string =>
  `${usuarioId}_${localId}`;

const marcarAvaliadosEFavoritos = async <T extends {id: string}>(
  itens: T[],
  uid: string,
): Promise<(T & {avaliado: boolean; favorito: boolean})[]> => {
  if (itens.length === 0) {
    return [];
  }
  const idsFeedback = itens.map((item) => idFeedbackLocal(uid, item.id));
  const [docs, favoritoIds] = await Promise.all([
    usuarioLocalFeedbackRepository.buscarPorIds(idsFeedback),
    usuarioLocalFavoritoRepository.listarLocalIdsPorUsuario(uid),
  ]);
  const avaliados = new Set(docs.map((doc) => doc.localId));
  const favoritos = new Set(favoritoIds);
  return itens.map((item) => ({
    ...item,
    avaliado: avaliados.has(item.id),
    favorito: favoritos.has(item.id),
  }));
};


locaisRouter.get("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const query = validarQueryGeoOpcional(req);
    if (query && "erro" in query) {
      res.status(query.status).json({erro: query.erro});
      return;
    }

    const locais = await localRepository.listar();
    if (!query) {
      const enriquecidos = await marcarAvaliadosEFavoritos(locais, uid);
      res.json(enriquecidos);
      return;
    }

    const itens = filtrarLocaisFeed(
      locais,
      {lat: query.lat, lng: query.lng, raioKm: query.raioKm},
      query.q,
    );
    const enriquecidos = await marcarAvaliadosEFavoritos(itens, uid);
    res.json(enriquecidos);
  } catch (error) {
    responderErro(res, error);
  }
});

const numeroQuery = (valor: unknown): number => {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  return typeof bruto === "string" || typeof bruto === "number" ?
    Number(bruto) :
    Number.NaN;
};

locaisRouter.get("/proximo", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const resultado = await buscarPontoProximo(uid, {
      lat: numeroQuery(req.query.lat),
      lng: numeroQuery(req.query.lng),
      accuracy: numeroQuery(req.query.accuracy),
    });
    if (!resultado.ok) {
      res.status(400).json({erro: resultado.erro});
      return;
    }
    res.json({ponto: resultado.ponto});
  } catch (error) {
    responderErro(res, error);
  }
});

locaisRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const local = await localRepository.buscarPorId(param(req, "id"));
    if (!local) {
      res.status(404).json({erro: "Local não encontrado"});
      return;
    }

    const [feedback, favorito, agregado, stories] = await Promise.all([
      usuarioLocalFeedbackRepository.buscarPorUsuarioELocal(uid, local.id),
      usuarioLocalFavoritoRepository.buscarPorUsuarioELocal(uid, local.id),
      usuarioRepository.buscarAgregadoCheckin(uid),
      detalheStoriesLocal(local.id).catch((error) => {
        log.warn("Local", "Stories do detalhe indisponíveis", erroDe(error));
        return {storiesAtivas: 0, eventoAoVivo: null};
      }),
    ]);
    res.json({
      ...local,
      avaliado: feedback !== null,
      favorito: favorito !== null,
      checkinProprio: Boolean(agregado?.locaisVisitadosIds.includes(local.id)),
      storiesAtivas: stories.storiesAtivas,
      eventoAoVivo: stories.eventoAoVivo,
    });
  } catch (error) {
    responderErro(res, error);
  }
});

locaisRouter.post("/", exigirAdmin, async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const validado = validarPublicacaoLocal(req.body);
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }

    const criado = await localRepository.criar({
      ...validado.dados,
      criadorId: uid,
    });
    log.info("Local", "Local criado", {localId: criado.id, criadorId: uid});
    res.status(201).json(criado);
  } catch (error) {
    responderErro(res, error);
  }
});
