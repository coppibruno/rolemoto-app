import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {apelidoExibicao} from "../lib/apelido";
import {erroDe, log} from "../lib/log";
import {notificarComentarioFoto} from "../lib/notificacoes";
import {
  comentarioDe,
  dentroDoTeto,
  legendaDe,
  marcaDe,
} from "../lib/post-foto";
import {
  apagarArquivoPost,
  nomeDaMarca,
  paraComentarios,
  paraDetalhe,
} from "../lib/post-foto-publico";
import {encaminharPostParaStory, validarFotoStory} from "../lib/story-local";
import {postFotoRepository, usuarioRepository} from "../repositories";
import type {PostFoto} from "../types/post-foto";

/**
 * Fotos permanentes do perfil.
 *
 * POST   /posts
 * GET    /posts/:id
 * DELETE /posts/:id
 * GET    /posts/:id/comentarios
 * POST   /posts/:id/comentarios
 * DELETE /posts/:id/comentarios/:comentarioId
 * POST   /posts/:id/story
 */
export const postsRouter = Router();

postsRouter.use(autenticar);
postsRouter.use(rateLimitAutenticado);

const JANELA_MS = 24 * 60 * 60 * 1000;
const ERRO_FOTO = "foto inválida";
const ERRO_POST = "Foto não encontrada";
const ERRO_COMENTARIO = "Comentário não encontrado";
const ERRO_STORY_GENERICO = "Não foi possível adicionar ao story";

const campo = (body: unknown, nome: string): unknown =>
  body && typeof body === "object" ? (body as Record<string, unknown>)[nome] : undefined;

const lerParam = (valor: unknown): string =>
  typeof valor === "string" ? valor.trim() : "";

const cursorDaQuery = (req: Request): string | null => {
  const valor = req.query.cursor;
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
};

/** Responde 404 e devolve `null` quando o post não existe. */
const postOu404 = async (req: Request, res: Response): Promise<PostFoto | null> => {
  const post = await postFotoRepository.buscarPorId(lerParam(req.params.id));
  if (!post) {
    res.status(404).json({erro: ERRO_POST});
  }
  return post;
};

const encaminharSemDerrubar = async (
  uid: string,
  post: PostFoto,
): Promise<{story: {id: string} | null; erroStory: string | null}> => {
  try {
    const resultado = await encaminharPostParaStory(uid, post);
    if (!resultado.ok) {
      return {story: null, erroStory: resultado.erro};
    }
    return {story: {id: resultado.storyId}, erroStory: null};
  } catch (error) {
    log.warn("PostFoto", "Story não encaminhada na publicação", {
      uid,
      postId: post.id,
      ...erroDe(error),
    });
    return {story: null, erroStory: ERRO_STORY_GENERICO};
  }
};

postsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const fotoUrl = campo(req.body, "fotoUrl");
    const foto = validarFotoStory(fotoUrl, `posts/${uid}`);
    if (!foto.ok) {
      res.status(400).json({erro: ERRO_FOTO});
      return;
    }
    const legenda = legendaDe(campo(req.body, "legenda"));
    if (!legenda.ok) {
      res.status(400).json({erro: legenda.erro});
      return;
    }
    const marca = marcaDe(campo(req.body, "marca"));
    if (!marca.ok) {
      res.status(400).json({erro: marca.erro});
      return;
    }
    const encaminhar = campo(req.body, "encaminharStory");
    if (encaminhar !== undefined && typeof encaminhar !== "boolean") {
      res.status(400).json({erro: ERRO_FOTO});
      return;
    }
    if (marca.valor && !(await nomeDaMarca(marca.valor))) {
      res.status(404).json({erro: "marca não encontrada"});
      return;
    }

    const post = await postFotoRepository.criarDentroDoTeto({
      usuarioId: uid,
      fotoUrl: (fotoUrl as string).trim(),
      storagePath: foto.storagePath,
      legenda: legenda.valor,
      marcaTipo: marca.valor?.tipo ?? null,
      marcaId: marca.valor?.id ?? null,
    }, new Date(Date.now() - JANELA_MS), dentroDoTeto);
    if (!post) {
      res.status(429).json({erro: "Você já publicou 10 fotos hoje"});
      return;
    }

    const story = encaminhar === true ?
      await encaminharSemDerrubar(uid, post) :
      {story: null, erroStory: null};
    res.status(201).json({
      post: await paraDetalhe(post, uid, story.story !== null),
      ...story,
    });
  } catch (error) {
    responderErro(res, error);
  }
});

postsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid as string;
    const post = await postOu404(req, res);
    if (!post) {
      return;
    }
    res.json(await paraDetalhe(post, uid));
  } catch (error) {
    responderErro(res, error);
  }
});

postsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    const post = await postOu404(req, res);
    if (!post) {
      return;
    }
    if (post.usuarioId !== uid) {
      res.status(403).json({erro: "só o autor apaga"});
      return;
    }
    await postFotoRepository.remover(post.id);
    await apagarArquivoPost(post.storagePath);
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});

postsRouter.get("/:id/comentarios", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid as string;
    const post = await postOu404(req, res);
    if (!post) {
      return;
    }
    const pagina = await postFotoRepository.listarComentarios(post.id, cursorDaQuery(req));
    if (!pagina.ok) {
      res.status(400).json({erro: "cursor inválido"});
      return;
    }
    res.json({
      itens: await paraComentarios(pagina.itens, post, uid),
      proximoCursor: pagina.proximoCursor,
    });
  } catch (error) {
    responderErro(res, error);
  }
});

postsRouter.post("/:id/comentarios", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid as string;
    const post = await postOu404(req, res);
    if (!post) {
      return;
    }
    const texto = comentarioDe(campo(req.body, "texto"));
    if (!texto.ok) {
      res.status(400).json({erro: texto.erro});
      return;
    }
    const resultado = await postFotoRepository.comentar({
      postId: post.id,
      usuarioId: uid,
      texto: texto.valor,
    });
    if (resultado.tipo === "post_ausente") {
      res.status(404).json({erro: ERRO_POST});
      return;
    }
    if (uid !== post.usuarioId) {
      try {
        const eu = await usuarioRepository.buscarPorId(uid);
        await notificarComentarioFoto(post.usuarioId, post.id, apelidoExibicao(eu));
      } catch (error) {
        log.warn("PostFoto", "Falha no push de comentário", {
          uid,
          postId: post.id,
          ...erroDe(error),
        });
      }
    }
    const [publico] = await paraComentarios([resultado.comentario], post, uid);
    res.status(201).json(publico);
  } catch (error) {
    responderErro(res, error);
  }
});

postsRouter.delete(
  "/:id/comentarios/:comentarioId",
  async (req: Request, res: Response) => {
    try {
      const uid = req.usuario?.uid;
      const postId = lerParam(req.params.id);
      const [post, comentario] = await Promise.all([
        postFotoRepository.buscarPorId(postId),
        postFotoRepository.buscarComentario(lerParam(req.params.comentarioId)),
      ]);
      if (!post || !comentario || comentario.postId !== postId) {
        res.status(404).json({erro: ERRO_COMENTARIO});
        return;
      }
      if (uid !== comentario.usuarioId && uid !== post.usuarioId) {
        res.status(403).json({erro: "não dá para apagar"});
        return;
      }
      await postFotoRepository.apagarComentario(comentario);
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
);

postsRouter.post("/:id/story", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid as string;
    const post = await postOu404(req, res);
    if (!post) {
      return;
    }
    const resultado = await encaminharPostParaStory(uid, post);
    if (!resultado.ok) {
      res.status(resultado.status).json({erro: resultado.erro});
      return;
    }
    res.status(resultado.criada ? 201 : 200).json({storyId: resultado.storyId});
  } catch (error) {
    responderErro(res, error);
  }
});
