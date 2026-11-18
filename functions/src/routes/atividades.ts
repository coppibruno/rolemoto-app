import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {apelidoExibicao} from "../lib/apelido";
import {aceitaComentario, idAtividade, textoDoComentario} from "../lib/atividade";
import {montarItens, paraComentariosPublicos, removerSumidas} from "../lib/atividade-publica";
import {erroDe, log} from "../lib/log";
import {notificarComentarioAtividade, notificarComentarioFoto} from "../lib/notificacoes";
import {atividadeRepository, postFotoRepository, usuarioRepository} from "../repositories";
import type {Atividade, AtividadeCreate} from "../types/atividade";
import type {PostFoto} from "../types/post-foto";

/**
 * Item do Início, curtida e comentários.
 *
 * GET    /atividades/:id
 * POST   /atividades/:id/curtida
 * DELETE /atividades/:id/curtida
 * GET    /atividades/:id/comentarios
 * POST   /atividades/:id/comentarios
 * DELETE /atividades/:id/comentarios/:comentarioId
 *
 * O tipo `foto` usa a conversa do post (`userspostcomentario`).
 */
export const atividadesRouter = Router();

atividadesRouter.use(autenticar);
atividadesRouter.use(rateLimitAutenticado);

const ERRO_ATIVIDADE = "Atividade não encontrada";
const ERRO_COMENTARIO = "Comentário não encontrado";
const PREFIXO_FOTO = "foto_";

const lerParam = (valor: unknown): string =>
  typeof valor === "string" ? valor.trim() : "";

const cursorDaQuery = (req: Request): string | null => {
  const valor = req.query.cursor;
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
};

const atividadeOu404 = async (req: Request, res: Response): Promise<Atividade | null> => {
  const atividade = await atividadeRepository.buscarPorId(lerParam(req.params.id));
  if (!atividade) {
    res.status(404).json({erro: ERRO_ATIVIDADE});
  }
  return atividade;
};

/** Post sem atividade (gravação falhou) ganha a atividade na primeira curtida. */
const atividadeDoPost = async (id: string): Promise<AtividadeCreate | undefined> => {
  if (!id.startsWith(PREFIXO_FOTO)) return undefined;
  const post = await postFotoRepository.buscarPorId(id.slice(PREFIXO_FOTO.length));
  if (!post) return undefined;
  return {
    id: idAtividade("foto", [post.id]),
    tipo: "foto",
    autorId: post.usuarioId,
    alvoTipo: "post",
    alvoId: post.id,
    refId: post.id,
    createdAt: post.createdAt,
  };
};

const postDaFoto = async (atividade: Atividade, res: Response): Promise<PostFoto | null> => {
  const post = await postFotoRepository.buscarPorId(atividade.alvoId);
  if (!post) {
    res.status(404).json({erro: ERRO_ATIVIDADE});
  }
  return post;
};

const pushSemDerrubar = async (
  contexto: Record<string, string>,
  enviar: () => Promise<unknown>,
) => {
  try {
    await enviar();
  } catch (error) {
    log.warn("Atividade", "Falha no push de comentário", {...contexto, ...erroDe(error)});
  }
};

atividadesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid as string;
    const atividade = await atividadeOu404(req, res);
    if (!atividade) return;
    const {itens, sumidas} = await montarItens([atividade], uid, false);
    removerSumidas(sumidas);
    if (itens.length === 0) {
      res.status(404).json({erro: ERRO_ATIVIDADE});
      return;
    }
    res.json(itens[0]);
  } catch (error) {
    responderErro(res, error);
  }
});

atividadesRouter.post("/:id/curtida", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid as string;
    const id = lerParam(req.params.id);
    const existe = await atividadeRepository.buscarPorId(id);
    const criar = existe ? undefined : await atividadeDoPost(id);
    if (!existe && !criar) {
      res.status(404).json({erro: ERRO_ATIVIDADE});
      return;
    }
    const resultado = await atividadeRepository.curtir(uid, id, criar);
    if (resultado.tipo === "ausente") {
      res.status(404).json({erro: ERRO_ATIVIDADE});
      return;
    }
    res
      .status(resultado.mudou ? 201 : 200)
      .json({curtido: true, totalCurtidas: resultado.totalCurtidas});
  } catch (error) {
    responderErro(res, error);
  }
});

atividadesRouter.delete("/:id/curtida", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid as string;
    const resultado = await atividadeRepository.descurtir(uid, lerParam(req.params.id));
    if (resultado.tipo === "ausente") {
      res.status(404).json({erro: ERRO_ATIVIDADE});
      return;
    }
    res.json({curtido: false, totalCurtidas: resultado.totalCurtidas});
  } catch (error) {
    responderErro(res, error);
  }
});

atividadesRouter.get("/:id/comentarios", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid as string;
    const atividade = await atividadeOu404(req, res);
    if (!atividade) return;
    const cursor = cursorDaQuery(req);

    if (atividade.tipo === "foto") {
      const post = await postDaFoto(atividade, res);
      if (!post) return;
      const pagina = await postFotoRepository.listarComentarios(post.id, cursor);
      if (!pagina.ok) {
        res.status(400).json({erro: "cursor inválido"});
        return;
      }
      res.json({
        itens: await paraComentariosPublicos(pagina.itens, post.usuarioId, uid),
        proximoCursor: pagina.proximoCursor,
      });
      return;
    }

    if (!aceitaComentario(atividade.tipo)) {
      res.json({itens: [], proximoCursor: null});
      return;
    }
    const pagina = await atividadeRepository.listarComentarios(atividade.id, cursor);
    if (!pagina.ok) {
      res.status(400).json({erro: "cursor inválido"});
      return;
    }
    res.json({
      itens: await paraComentariosPublicos(pagina.itens, atividade.autorId, uid),
      proximoCursor: pagina.proximoCursor,
    });
  } catch (error) {
    responderErro(res, error);
  }
});

atividadesRouter.post("/:id/comentarios", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid as string;
    const atividade = await atividadeOu404(req, res);
    if (!atividade) return;
    if (!aceitaComentario(atividade.tipo)) {
      res.status(400).json({erro: "este item não aceita comentário"});
      return;
    }
    const corpo = req.body && typeof req.body === "object" ?
      req.body as Record<string, unknown> :
      {};
    const texto = textoDoComentario(corpo.texto);
    if (!texto.ok) {
      res.status(400).json({erro: texto.erro});
      return;
    }

    if (atividade.tipo === "foto") {
      const post = await postDaFoto(atividade, res);
      if (!post) return;
      const resultado = await postFotoRepository.comentar({
        postId: post.id,
        usuarioId: uid,
        texto: texto.valor,
      });
      if (resultado.tipo === "post_ausente") {
        res.status(404).json({erro: ERRO_ATIVIDADE});
        return;
      }
      if (uid !== post.usuarioId) {
        await pushSemDerrubar({uid, postId: post.id}, async () => {
          const eu = await usuarioRepository.buscarPorId(uid);
          await notificarComentarioFoto(post.usuarioId, post.id, apelidoExibicao(eu), uid);
        });
      }
      const [publico] = await paraComentariosPublicos([resultado.comentario], post.usuarioId, uid);
      res.status(201).json(publico);
      return;
    }

    const resultado = await atividadeRepository.comentar({
      atividadeId: atividade.id,
      usuarioId: uid,
      texto: texto.valor,
    });
    if (resultado.tipo === "ausente") {
      res.status(404).json({erro: ERRO_ATIVIDADE});
      return;
    }
    if (uid !== atividade.autorId) {
      await pushSemDerrubar({uid, atividadeId: atividade.id}, async () => {
        const eu = await usuarioRepository.buscarPorId(uid);
        await notificarComentarioAtividade(
          atividade.autorId,
          atividade.id,
          atividade.tipo,
          apelidoExibicao(eu),
          texto.valor,
          uid,
        );
      });
    }
    const [publico] = await paraComentariosPublicos(
      [resultado.comentario],
      atividade.autorId,
      uid,
    );
    res.status(201).json(publico);
  } catch (error) {
    responderErro(res, error);
  }
});

atividadesRouter.delete(
  "/:id/comentarios/:comentarioId",
  async (req: Request, res: Response) => {
    try {
      const uid = req.usuario?.uid as string;
      const atividade = await atividadeRepository.buscarPorId(lerParam(req.params.id));
      const comentarioId = lerParam(req.params.comentarioId);
      if (!atividade) {
        res.status(404).json({erro: ERRO_COMENTARIO});
        return;
      }

      if (atividade.tipo === "foto") {
        const [post, comentario] = await Promise.all([
          postFotoRepository.buscarPorId(atividade.alvoId),
          postFotoRepository.buscarComentario(comentarioId),
        ]);
        if (!post || !comentario || comentario.postId !== post.id) {
          res.status(404).json({erro: ERRO_COMENTARIO});
          return;
        }
        if (uid !== comentario.usuarioId && uid !== post.usuarioId) {
          res.status(403).json({erro: "não dá para apagar"});
          return;
        }
        await postFotoRepository.apagarComentario(comentario);
        res.status(204).send();
        return;
      }

      const comentario = await atividadeRepository.buscarComentario(comentarioId);
      if (!comentario || comentario.atividadeId !== atividade.id) {
        res.status(404).json({erro: ERRO_COMENTARIO});
        return;
      }
      if (uid !== comentario.usuarioId && uid !== atividade.autorId) {
        res.status(403).json({erro: "não dá para apagar"});
        return;
      }
      await atividadeRepository.apagarComentario(comentario);
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
);
