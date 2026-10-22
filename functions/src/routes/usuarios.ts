import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {apelidoExibicao} from "../lib/apelido";
import {carregarHistoricoPublico} from "../lib/carregar-historico";
import {paraItemHistoricoTelemetria} from "../lib/role-telemetria";
import {hidratarSelosSeVazio} from "../lib/checkin-local";
import {
  apagarStoryPerfil,
  contarStoriesUsuario,
  listarStoriesUsuario,
  marcarVistoPerfil,
} from "../lib/story-local";
import {roleTelemetriaRepository, usuarioRepository} from "../repositories";
import type {PerfilPublico, Usuario} from "../types/usuario";

/**
 * Perfil público de qualquer piloto autenticado.
 *
 * GET /usuarios/:uid
 * GET /usuarios/:uid/stories
 * GET /usuarios/:uid/historico
 * GET /usuarios/:uid/telemetria
 */
export const usuariosRouter = Router();

usuariosRouter.use(autenticar);
usuariosRouter.use(rateLimitAutenticado);

const paraPerfilPublico = async (usuario: Usuario): Promise<PerfilPublico> => ({
  uid: usuario.uid,
  nome: usuario.nome,
  apelido: apelidoExibicao(usuario),
  fotoUrl: usuario.fotoUrl,
  moto: usuario.moto,
  tipoMoto: usuario.tipoMoto,
  pilotagem: usuario.pilotagem,
  cidade: usuario.cidade,
  garupaFrequente: usuario.garupaFrequente,
  selos: await hidratarSelosSeVazio(usuario.uid, usuario.selos),
});

const lerUid = (req: Request): string =>
  typeof req.params.uid === "string" ? req.params.uid.trim() : "";

usuariosRouter.get("/:uid/telemetria", async (req: Request, res: Response) => {
  try {
    const uid = lerUid(req);
    if (!uid) {
      res.status(400).json({erro: "uid inválido"});
      return;
    }

    const perfil = await usuarioRepository.buscarPorId(uid);
    if (!perfil) {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }

    const lista = await roleTelemetriaRepository.listarPorUsuario(uid);
    const visiveis =
      req.usuario?.uid === uid ? lista : lista.filter((item) => item.publica);
    res.json(visiveis.map(paraItemHistoricoTelemetria));
  } catch (error) {
    responderErro(res, error);
  }
});

usuariosRouter.get("/:uid/historico", async (req: Request, res: Response) => {
  try {
    const uid = lerUid(req);
    if (!uid) {
      res.status(400).json({erro: "uid inválido"});
      return;
    }

    const perfil = await usuarioRepository.buscarPorId(uid);
    if (!perfil) {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }

    res.json(await carregarHistoricoPublico(uid));
  } catch (error) {
    responderErro(res, error);
  }
});

const storyIdDoBody = (body: unknown): string => {
  if (!body || typeof body !== "object") {
    return "";
  }
  const valor = (body as Record<string, unknown>).storyId;
  return typeof valor === "string" ? valor.trim() : "";
};

usuariosRouter.get("/:uid/stories", async (req: Request, res: Response) => {
  try {
    if (!req.usuario?.uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const uid = lerUid(req);
    const perfil = await usuarioRepository.buscarPorId(uid);
    if (!perfil) {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }
    if (req.query.resumo === "1") {
      res.json({storiesAtivas: await contarStoriesUsuario(uid)});
      return;
    }
    res.json(await listarStoriesUsuario(uid));
  } catch (error) {
    responderErro(res, error);
  }
});

usuariosRouter.post("/:uid/stories/visto", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const storyId = storyIdDoBody(req.body);
    if (!storyId) {
      res.status(404).json({erro: "Story não encontrada"});
      return;
    }
    const resultado = await marcarVistoPerfil(uid, lerUid(req), storyId);
    if (!resultado.ok) {
      res.status(resultado.status).json({erro: resultado.erro});
      return;
    }
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});

usuariosRouter.delete("/:uid/stories/:storyId", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid || uid !== lerUid(req)) {
      res.status(403).json({erro: "só o autor apaga"});
      return;
    }
    const storyId = typeof req.params.storyId === "string" ? req.params.storyId : "";
    const resultado = await apagarStoryPerfil(uid, storyId);
    if (!resultado.ok) {
      res.status(resultado.status).json({erro: resultado.erro});
      return;
    }
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});

usuariosRouter.get("/:uid", async (req: Request, res: Response) => {
  try {
    const uid = lerUid(req);
    if (!uid) {
      res.status(400).json({erro: "uid inválido"});
      return;
    }

    const perfil = await usuarioRepository.buscarPorId(uid);
    if (!perfil) {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }

    res.json(await paraPerfilPublico(perfil));
  } catch (error) {
    responderErro(res, error);
  }
});
