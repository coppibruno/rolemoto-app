import {Router, Request, Response} from "express";
import {apelidoExibicao} from "../lib/apelido";
import {param} from "../lib/params";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {
  notificacaoInboxRepository,
  usuarioRepository,
} from "../repositories";
import type {NotificacaoInboxItem} from "../types/notificacao-inbox";

/**
 * Inbox in-app (SPEC 068). Gravação vem do gancho em `lib/notificacoes.ts`.
 *
 * GET  /notificacoes
 * GET  /notificacoes/nao-lidas
 * POST /notificacoes/lidas
 * POST /notificacoes/:id/lida
 */
export const notificacoesRouter = Router();

notificacoesRouter.use(autenticar);
notificacoesRouter.use(rateLimitAutenticado);

const cursorDaQuery = (req: Request): string | null => {
  const valor = req.query.cursor;
  if (typeof valor !== "string") {
    return null;
  }
  return valor.trim() || null;
};

notificacoesRouter.get("/nao-lidas", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    res.json({total: await notificacaoInboxRepository.contarNaoLidas(uid)});
  } catch (error) {
    responderErro(res, error);
  }
});

notificacoesRouter.post("/lidas", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    await notificacaoInboxRepository.marcarTodasLidas(uid);
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});

notificacoesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const pagina = await notificacaoInboxRepository.listarDoUsuario(
      uid,
      cursorDaQuery(req),
    );
    if (!pagina.ok) {
      res.status(400).json({erro: "cursor inválido"});
      return;
    }
    const atorIds = [
      ...new Set(
        pagina.itens
          .map((item) => item.atorUid)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const usuarios = await usuarioRepository.buscarPorIds(atorIds);
    const porUid = new Map(usuarios.map((u) => [u.uid, u]));
    const itens: NotificacaoInboxItem[] = pagina.itens.map((item) => {
      const ator = item.atorUid ? porUid.get(item.atorUid) : undefined;
      return {
        id: item.id,
        tipo: item.tipo,
        title: item.title,
        body: item.body,
        url: item.url,
        lida: item.lida,
        createdAt: item.createdAt,
        ator: item.atorUid ?
          {
            uid: item.atorUid,
            nome: apelidoExibicao(ator ?? null),
            fotoUrl: ator?.fotoUrl ?? "",
          } :
          null,
      };
    });
    res.json({itens, nextCursor: pagina.proximoCursor});
  } catch (error) {
    responderErro(res, error);
  }
});

notificacoesRouter.post("/:id/lida", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const id = param(req, "id");
    const atualizada = await notificacaoInboxRepository.marcarLida(id, uid);
    if (!atualizada) {
      res.status(404).json({erro: "Notificação não encontrada"});
      return;
    }
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});
