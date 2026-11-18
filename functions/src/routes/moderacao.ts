import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {
  ERRO_BLOQUEAR_SI,
  ERRO_DENUNCIAR_PROPRIO,
  ERRO_PERFIL_INDISPONIVEL,
  validarBodyDenuncia,
} from "../lib/moderacao";
import {param} from "../lib/params";
import {
  atividadeRepository,
  bloqueioRepository,
  denunciaRepository,
  postFotoRepository,
  seguirRepository,
  storyLocalRepository,
  usuarioRepository,
} from "../repositories";
import type {AlvoDenuncia} from "../types/moderacao";

/**
 * Denúncia e bloqueio (SPEC 069).
 *
 * POST|DELETE /usuarios/:uid/bloqueio  → registrado em usuarios.ts
 * GET  /bloqueios
 * POST /denuncias
 */
export const bloqueiosRouter = Router();
export const denunciasRouter = Router();

bloqueiosRouter.use(autenticar);
bloqueiosRouter.use(rateLimitAutenticado);
denunciasRouter.use(autenticar);
denunciasRouter.use(rateLimitAutenticado);

const cursorDaQuery = (req: Request): string | null => {
  const valor = req.query.cursor;
  if (typeof valor !== "string") {
    return null;
  }
  return valor.trim() || null;
};

/** Resolve o autor do alvo. `null` = alvo inexistente. */
export const resolverAcusadoId = async (
  alvoTipo: AlvoDenuncia,
  alvoId: string,
): Promise<string | null> => {
  switch (alvoTipo) {
  case "perfil": {
    const perfil = await usuarioRepository.buscarPorId(alvoId);
    return perfil ? perfil.uid : null;
  }
  case "post": {
    const post = await postFotoRepository.buscarPorId(alvoId);
    return post?.usuarioId ?? null;
  }
  case "comentario_post": {
    const comentario = await postFotoRepository.buscarComentario(alvoId);
    return comentario?.usuarioId ?? null;
  }
  case "story": {
    const story = await storyLocalRepository.buscarPorId(alvoId);
    return story?.usuarioId ?? null;
  }
  case "atividade": {
    const atividade = await atividadeRepository.buscarPorId(alvoId);
    return atividade?.autorId ?? null;
  }
  case "comentario_atividade": {
    const comentario = await atividadeRepository.buscarComentario(alvoId);
    return comentario?.usuarioId ?? null;
  }
  default:
    return null;
  }
};

/**
 * POST /usuarios/:uid/bloqueio — chamado a partir de usuarios.ts
 * ou reexportado para montagem.
 */
export const bloquearUsuario = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const token = req.usuario?.uid;
    if (!token) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const uid = param(req, "uid").trim();
    if (!uid) {
      res.status(400).json({erro: "uid inválido"});
      return;
    }
    if (uid === token) {
      res.status(400).json({erro: ERRO_BLOQUEAR_SI});
      return;
    }

    const resultado = await bloqueioRepository.bloquear(token, uid);
    if (resultado === "alvo_ausente" || resultado === "bloqueador_ausente") {
      res.status(404).json({erro: ERRO_PERFIL_INDISPONIVEL});
      return;
    }

    await Promise.all([
      seguirRepository.deixarDeSeguir(token, uid),
      seguirRepository.deixarDeSeguir(uid, token),
    ]);

    res.status(200).json({
      bloqueado: true,
      novo: resultado === "criado",
    });
  } catch (error) {
    responderErro(res, error);
  }
};

export const desbloquearUsuario = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const token = req.usuario?.uid;
    if (!token) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const uid = param(req, "uid").trim();
    if (!uid) {
      res.status(400).json({erro: "uid inválido"});
      return;
    }
    if (uid === token) {
      res.status(400).json({erro: ERRO_BLOQUEAR_SI});
      return;
    }

    await bloqueioRepository.desbloquear(token, uid);
    res.status(200).json({bloqueado: false});
  } catch (error) {
    responderErro(res, error);
  }
};

bloqueiosRouter.get("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const pagina = await bloqueioRepository.paginaLinhas(uid, cursorDaQuery(req));
    if (!pagina.ok) {
      res.status(400).json({erro: "cursor inválido"});
      return;
    }
    res.json(pagina.pagina);
  } catch (error) {
    responderErro(res, error);
  }
});

denunciasRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const validado = validarBodyDenuncia(body);
    if ("erro" in validado) {
      res.status(400).json({erro: validado.erro});
      return;
    }

    const acusadoId = await resolverAcusadoId(validado.alvoTipo, validado.alvoId);
    if (!acusadoId) {
      res.status(404).json({erro: "alvo não encontrado"});
      return;
    }
    if (acusadoId === uid) {
      res.status(400).json({erro: ERRO_DENUNCIAR_PROPRIO});
      return;
    }

    const resultado = await denunciaRepository.criar({
      denuncianteId: uid,
      alvoTipo: validado.alvoTipo,
      alvoId: validado.alvoId,
      acusadoId,
      motivo: validado.motivo,
      detalhes: validado.detalhes,
    });

    if (resultado.tipo === "duplicada") {
      res.status(200).json({novo: false});
      return;
    }
    res.status(201).json({novo: true, id: resultado.id});
  } catch (error) {
    responderErro(res, error);
  }
});
