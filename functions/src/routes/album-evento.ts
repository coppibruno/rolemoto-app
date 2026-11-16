import {Router, Request, Response} from "express";
import {apelidoExibicao} from "../lib/apelido";
import {
  fraseAlbum,
  podePublicarAlbum,
  validarUrlAlbum,
} from "../lib/album-evento";
import {registrarAtividade, removerAtividade} from "../lib/atividade-gancho";
import {erroDe, log} from "../lib/log";
import {notificarAlbumEvento} from "../lib/notificacoes";
import {param} from "../lib/params";
import {exigirAdmin} from "../middleware/exigir-admin";
import {responderErro} from "../middleware/errors";
import {
  eventoRepository,
  usuarioEventoRepository,
  usuarioRepository,
} from "../repositories";
import type {AlbumEventoPublico} from "../types/evento";

/**
 * POST|DELETE /eventos/:id/fotografo
 * POST /eventos/:id/albuns
 * DELETE /eventos/:id/albuns/:albumId
 */
export const albumEventoRouter = Router();

const uidAutenticado = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

const albumPublico = (album: {
  id: string;
  url: string;
  createdAt: string;
}): AlbumEventoPublico => ({
  id: album.id,
  url: album.url,
  createdAt: album.createdAt,
});

albumEventoRouter.post(
  "/:id/fotografo",
  exigirAdmin,
  async (req: Request, res: Response) => {
    try {
      const token = uidAutenticado(req, res);
      if (!token) {
        return;
      }
      const usuarioId =
        req.body && typeof req.body === "object" ?
          String((req.body as {usuarioId?: unknown}).usuarioId ?? "").trim() :
          "";
      if (!usuarioId || usuarioId.length > 128) {
        res.status(400).json({erro: "informe o piloto"});
        return;
      }

      const evento = await eventoRepository.buscarPorId(param(req, "id"));
      if (!evento) {
        res.status(404).json({erro: "Evento não encontrado"});
        return;
      }

      const piloto = await usuarioRepository.buscarPorId(usuarioId);
      if (!piloto) {
        res.status(404).json({erro: "piloto não encontrado"});
        return;
      }

      const atualizado = await eventoRepository.definirFotografo(evento.id, usuarioId);
      if (!atualizado) {
        res.status(404).json({erro: "Evento não encontrado"});
        return;
      }

      log.info("Evento", "Fotógrafo definido", {
        eventoId: evento.id,
        fotografoId: usuarioId,
        adminId: token,
      });
      res.json({fotografoId: usuarioId});
    } catch (error) {
      responderErro(res, error);
    }
  },
);

albumEventoRouter.delete(
  "/:id/fotografo",
  exigirAdmin,
  async (req: Request, res: Response) => {
    try {
      if (!uidAutenticado(req, res)) {
        return;
      }
      const atualizado = await eventoRepository.definirFotografo(param(req, "id"), null);
      if (!atualizado) {
        res.status(404).json({erro: "Evento não encontrado"});
        return;
      }
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
);

albumEventoRouter.post("/:id/albuns", async (req: Request, res: Response) => {
  try {
    const uid = uidAutenticado(req, res);
    if (!uid) {
      return;
    }

    const urlValidada = validarUrlAlbum(
      req.body && typeof req.body === "object" ?
        (req.body as {url?: unknown}).url :
        null,
    );
    if (!urlValidada.ok) {
      res.status(400).json({erro: urlValidada.erro});
      return;
    }

    const evento = await eventoRepository.buscarPorId(param(req, "id"));
    if (!evento) {
      res.status(404).json({erro: "Evento não encontrado"});
      return;
    }

    const perfil = await usuarioRepository.buscarPorId(uid);
    const admin = perfil?.admin === true;
    if (!podePublicarAlbum(uid, evento.fotografoId, admin)) {
      res.status(403).json({erro: "sem permissão para o álbum"});
      return;
    }

    const resultado = await eventoRepository.adicionarAlbum(
      evento.id,
      urlValidada.url,
      uid,
    );
    if (!resultado) {
      res.status(404).json({erro: "Evento não encontrado"});
      return;
    }
    if (resultado.tipo === "limite") {
      res.status(400).json({erro: "limite de 5 álbuns"});
      return;
    }
    if (resultado.tipo === "duplicado") {
      res.status(400).json({erro: "este link já está no evento"});
      return;
    }

    if (resultado.notificou) {
      await registrarAtividade({
        tipo: "album_evento",
        autorId: uid,
        alvoTipo: "evento",
        alvoId: evento.id,
        refId: evento.id,
        createdAt: resultado.album.createdAt,
        partes: [evento.id],
      });

      const vinculos = await usuarioEventoRepository.listarPorEvento(evento.id);
      const destinatarios = vinculos
        .map((v) => v.usuarioId)
        .filter((id) => id && id !== uid);
      const body = fraseAlbum(apelidoExibicao(perfil), evento.titulo);
      try {
        await notificarAlbumEvento(destinatarios, evento.id, body);
      } catch (error) {
        log.warn("Evento", "Falha ao notificar álbum", {
          eventoId: evento.id,
          ...erroDe(error),
        });
      }
    }

    res.status(201).json({
      album: albumPublico(resultado.album),
      notificou: resultado.notificou,
    });
  } catch (error) {
    responderErro(res, error);
  }
});

albumEventoRouter.delete(
  "/:id/albuns/:albumId",
  async (req: Request, res: Response) => {
    try {
      const uid = uidAutenticado(req, res);
      if (!uid) {
        return;
      }

      const evento = await eventoRepository.buscarPorId(param(req, "id"));
      if (!evento) {
        res.status(404).json({erro: "Evento não encontrado"});
        return;
      }

      const perfil = await usuarioRepository.buscarPorId(uid);
      const admin = perfil?.admin === true;
      if (!podePublicarAlbum(uid, evento.fotografoId, admin)) {
        res.status(403).json({erro: "sem permissão para o álbum"});
        return;
      }

      const resultado = await eventoRepository.removerAlbum(
        evento.id,
        param(req, "albumId"),
      );
      if (!resultado) {
        res.status(404).json({erro: "Evento não encontrado"});
        return;
      }
      if (resultado.tipo === "ausente") {
        res.status(404).json({erro: "álbum não encontrado"});
        return;
      }

      if (resultado.zerou) {
        await removerAtividade("album_evento", [evento.id]);
      }

      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
);
