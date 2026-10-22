import {Router, Request, Response} from "express";
import {validarQueryGeoOpcional} from "../lib/feed-query";
import {
  listarAneisAoVivo,
  publicarStoryEvento,
  publicarStoryLocal,
  publicarStoryPerfil,
  type GeoAneis,
} from "../lib/story-local";
import {eventoRepository, localRepository} from "../repositories";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";

/**
 * Faixa Ao vivo das abas Locais e Eventos.
 *
 * GET  /stories/ao-vivo?aba=locais|eventos
 * POST /stories  { fotoUrl, localId? | eventoId?, lat, lng, accuracy }
 */
export const storiesAoVivoRouter = Router();

storiesAoVivoRouter.use(autenticar);
storiesAoVivoRouter.use(rateLimitAutenticado);

storiesAoVivoRouter.get("/ao-vivo", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const aba = req.query.aba;
    if (aba !== "locais" && aba !== "eventos") {
      res.status(400).json({erro: "aba inválida"});
      return;
    }

    const query = validarQueryGeoOpcional(req);
    if (query && "erro" in query) {
      res.status(query.status).json({erro: query.erro});
      return;
    }

    const geo: GeoAneis | null = query ?
      {
        lat: query.lat,
        lng: query.lng,
        ...(query.raioKm !== undefined ? {raioKm: query.raioKm} : {}),
      } :
      null;

    const aneis = await listarAneisAoVivo(uid, aba, geo);
    res.json({aneis});
  } catch (error) {
    responderErro(res, error);
  }
});

const texto = (body: unknown, campo: string): string | null => {
  if (!body || typeof body !== "object") {
    return null;
  }
  const valor = (body as Record<string, unknown>)[campo];
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
};

storiesAoVivoRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const localId = texto(req.body, "localId");
    const eventoId = texto(req.body, "eventoId");
    if (localId && !eventoId) {
      const local = await localRepository.buscarPorId(localId);
      if (!local) {
        res.status(404).json({erro: "Local não encontrado"});
        return;
      }
      const resultado = await publicarStoryLocal(uid, local, req.body);
      if (!resultado.ok) {
        res.status(resultado.status).json({erro: resultado.erro});
        return;
      }
      res.status(201).json(resultado.story);
      return;
    }
    if (eventoId) {
      const evento = await eventoRepository.buscarPorId(eventoId);
      if (!evento) {
        res.status(404).json({erro: "Evento não encontrado"});
        return;
      }
      const resultado = await publicarStoryEvento(uid, evento, req.body);
      if (!resultado.ok) {
        res.status(resultado.status).json({erro: resultado.erro});
        return;
      }
      res.status(201).json(resultado.story);
      return;
    }

    const resultado = await publicarStoryPerfil(uid, req.body);
    if (!resultado.ok) {
      res.status(resultado.status).json({erro: resultado.erro});
      return;
    }
    res.status(201).json(resultado.story);
  } catch (error) {
    responderErro(res, error);
  }
});
