import {Router, Request, Response} from "express";
import {param} from "../lib/params";
import {
  apagarStoryEvento,
  listarStoriesEvento,
  marcarVistoEvento,
  publicarStoryEvento,
} from "../lib/story-local";
import {responderErro} from "../middleware/errors";
import {eventoRepository} from "../repositories";

/**
 * Stories do encontro. Com `localId`, o álbum gravado é o do local.
 *
 * POST   /eventos/:id/stories/visto
 * GET    /eventos/:id/stories
 * POST   /eventos/:id/stories
 * DELETE /eventos/:id/stories/:storyId
 */
export const storiesEventoRouter = Router();

const uidDe = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

const storyIdDoBody = (body: unknown): string => {
  if (!body || typeof body !== "object") {
    return "";
  }
  const valor = (body as Record<string, unknown>).storyId;
  return typeof valor === "string" ? valor.trim() : "";
};

storiesEventoRouter.post(
  "/:id/stories/visto",
  async (req: Request, res: Response) => {
    try {
      const uid = uidDe(req, res);
      if (!uid) {
        return;
      }
      const evento = await eventoRepository.buscarPorId(param(req, "id"));
      if (!evento) {
        res.status(404).json({erro: "Evento não encontrado"});
        return;
      }
      const storyId = storyIdDoBody(req.body);
      if (!storyId) {
        res.status(404).json({erro: "Story não encontrada"});
        return;
      }
      const resultado = await marcarVistoEvento(uid, evento, storyId);
      if (!resultado.ok) {
        res.status(resultado.status).json({erro: resultado.erro});
        return;
      }
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
);

storiesEventoRouter.get("/:id/stories", async (req: Request, res: Response) => {
  try {
    if (!uidDe(req, res)) {
      return;
    }
    const evento = await eventoRepository.buscarPorId(param(req, "id"));
    if (!evento) {
      res.status(404).json({erro: "Evento não encontrado"});
      return;
    }
    res.json(await listarStoriesEvento(evento));
  } catch (error) {
    responderErro(res, error);
  }
});

storiesEventoRouter.post("/:id/stories", async (req: Request, res: Response) => {
  try {
    const uid = uidDe(req, res);
    if (!uid) {
      return;
    }
    const evento = await eventoRepository.buscarPorId(param(req, "id"));
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
  } catch (error) {
    responderErro(res, error);
  }
});

storiesEventoRouter.delete(
  "/:id/stories/:storyId",
  async (req: Request, res: Response) => {
    try {
      const uid = uidDe(req, res);
      if (!uid) {
        return;
      }
      const evento = await eventoRepository.buscarPorId(param(req, "id"));
      if (!evento) {
        res.status(404).json({erro: "Evento não encontrado"});
        return;
      }
      const resultado = await apagarStoryEvento(
        uid,
        evento,
        param(req, "storyId"),
      );
      if (!resultado.ok) {
        res.status(resultado.status).json({erro: resultado.erro});
        return;
      }
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
);
