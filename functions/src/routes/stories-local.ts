import {Router, Request, Response} from "express";
import {param} from "../lib/params";
import {
  apagarStoryLocal,
  listarStoriesLocal,
  marcarVistoLocal,
  publicarStoryLocal,
} from "../lib/story-local";
import {responderErro} from "../middleware/errors";
import {localRepository} from "../repositories";

/**
 * Stories do álbum do local.
 *
 * POST   /locais/:id/stories/visto
 * GET    /locais/:id/stories
 * POST   /locais/:id/stories
 * DELETE /locais/:id/stories/:storyId
 *
 * `visto` fica antes de `:storyId`.
 */
export const storiesLocalRouter = Router();

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

storiesLocalRouter.post("/:id/stories/visto", async (req: Request, res: Response) => {
  try {
    const uid = uidDe(req, res);
    if (!uid) {
      return;
    }
    const local = await localRepository.buscarPorId(param(req, "id"));
    if (!local) {
      res.status(404).json({erro: "Local não encontrado"});
      return;
    }
    const storyId = storyIdDoBody(req.body);
    if (!storyId) {
      res.status(404).json({erro: "Story não encontrada"});
      return;
    }
    const resultado = await marcarVistoLocal(uid, local.id, storyId);
    if (!resultado.ok) {
      res.status(resultado.status).json({erro: resultado.erro});
      return;
    }
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});

storiesLocalRouter.get("/:id/stories", async (req: Request, res: Response) => {
  try {
    if (!uidDe(req, res)) {
      return;
    }
    const local = await localRepository.buscarPorId(param(req, "id"));
    if (!local) {
      res.status(404).json({erro: "Local não encontrado"});
      return;
    }
    res.json(await listarStoriesLocal(local.id));
  } catch (error) {
    responderErro(res, error);
  }
});

storiesLocalRouter.post("/:id/stories", async (req: Request, res: Response) => {
  try {
    const uid = uidDe(req, res);
    if (!uid) {
      return;
    }
    const local = await localRepository.buscarPorId(param(req, "id"));
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
  } catch (error) {
    responderErro(res, error);
  }
});

storiesLocalRouter.delete(
  "/:id/stories/:storyId",
  async (req: Request, res: Response) => {
    try {
      const uid = uidDe(req, res);
      if (!uid) {
        return;
      }
      const local = await localRepository.buscarPorId(param(req, "id"));
      if (!local) {
        res.status(404).json({erro: "Local não encontrado"});
        return;
      }
      const resultado = await apagarStoryLocal(
        uid,
        local.id,
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
