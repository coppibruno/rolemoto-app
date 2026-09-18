import {Router, Request, Response} from "express";
import {param} from "../lib/params";
import {responderErro} from "../middleware/errors";
import {
  localRepository,
  usuarioLocalFavoritoRepository,
} from "../repositories";

/**
 * Favoritos de locais oficiais.
 *
 * POST   /locais/:id/favorito
 * DELETE /locais/:id/favorito
 */
export const favoritoLocalRouter = Router();

const idFavorito = (usuarioId: string, localId: string): string =>
  `${usuarioId}_${localId}`;

favoritoLocalRouter.post(
  "/:id/favorito",
  async (req: Request, res: Response) => {
    try {
      const uid = req.usuario?.uid;
      if (!uid) {
        res.status(401).json({erro: "Não autenticado"});
        return;
      }

      const localId = param(req, "id");
      const local = await localRepository.buscarPorId(localId);
      if (!local) {
        res.status(404).json({erro: "Local não encontrado"});
        return;
      }

      const existente =
        await usuarioLocalFavoritoRepository.buscarPorUsuarioELocal(
          uid,
          localId,
        );
      if (existente) {
        res.status(200).json(existente);
        return;
      }

      const criado = await usuarioLocalFavoritoRepository.criar({
        usuarioId: uid,
        localId,
      });
      res.status(201).json(criado);
    } catch (error) {
      responderErro(res, error);
    }
  },
);

favoritoLocalRouter.delete(
  "/:id/favorito",
  async (req: Request, res: Response) => {
    try {
      const uid = req.usuario?.uid;
      if (!uid) {
        res.status(401).json({erro: "Não autenticado"});
        return;
      }

      const localId = param(req, "id");
      await usuarioLocalFavoritoRepository.remover(idFavorito(uid, localId));
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
);
