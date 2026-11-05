import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {apelidoExibicao} from "../lib/apelido";
import {ordenarBusca, termoBusca} from "../lib/busca-piloto";
import {carregarHistoricoPublico} from "../lib/carregar-historico";
import {erroDe, log} from "../lib/log";
import {notificarNovoSeguidor} from "../lib/notificacoes";
import {paraItemHistoricoTelemetria} from "../lib/role-telemetria";
import {hidratarSelosSeVazio} from "../lib/checkin-local";
import {
  apagarStoryPerfil,
  contarStoriesUsuario,
  listarStoriesUsuario,
  marcarVistoPerfil,
} from "../lib/story-local";
import {
  roleTelemetriaRepository,
  seguirRepository,
  usuarioRepository,
} from "../repositories";
import type {LinhaPiloto, VinculoEntre} from "../types/seguir";
import {LIMITE_BUSCA_PILOTOS} from "../types/seguir";
import type {PerfilPublico, Usuario} from "../types/usuario";

/**
 * Perfil público de qualquer piloto autenticado.
 *
 * GET /usuarios/busca
 * GET /usuarios/:uid
 * GET /usuarios/:uid/stories
 * GET /usuarios/:uid/historico
 * GET /usuarios/:uid/telemetria
 * GET /usuarios/:uid/seguindo
 * GET /usuarios/:uid/seguidores
 * POST|DELETE /usuarios/:uid/seguir
 */
export const usuariosRouter = Router();

usuariosRouter.use(autenticar);
usuariosRouter.use(rateLimitAutenticado);

type IdentidadeLinha = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  cidade: string;
};

const paraLinha = (
  pessoa: IdentidadeLinha,
  flags: VinculoEntre,
): LinhaPiloto => ({
  uid: pessoa.uid,
  nome: pessoa.nome,
  apelido: apelidoExibicao(pessoa),
  fotoUrl: pessoa.fotoUrl,
  cidade: pessoa.cidade,
  seguidoPorMim: flags.seguidoPorMim,
  segueVoce: flags.segueVoce,
});

const flagsDe = (
  mapa: Map<string, VinculoEntre>,
  uid: string,
  forcarSeguido: boolean,
): VinculoEntre => {
  const base = mapa.get(uid) ?? {seguidoPorMim: false, segueVoce: false};
  if (!forcarSeguido) {
    return base;
  }
  return {...base, seguidoPorMim: true};
};

const cursorDaQuery = (req: Request): string | null => {
  const valor = req.query.cursor;
  if (typeof valor !== "string") {
    return null;
  }
  const limpo = valor.trim();
  return limpo || null;
};

const qDaQuery = (req: Request): string => {
  const valor = req.query.q;
  return typeof valor === "string" ? valor : "";
};

const paraPerfilPublico = async (
  usuario: Usuario,
  tokenUid: string,
): Promise<PerfilPublico> => {
  const mapa = await seguirRepository.vinculosCom(tokenUid, [usuario.uid]);
  const vinculo = mapa.get(usuario.uid) ?? {
    seguidoPorMim: false,
    segueVoce: false,
  };
  return {
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
    seguindo: usuario.seguindo,
    seguidores: usuario.seguidores,
    seguidoPorMim: vinculo.seguidoPorMim,
    segueVoce: vinculo.segueVoce,
  };
};

const lerUid = (req: Request): string =>
  typeof req.params.uid === "string" ? req.params.uid.trim() : "";

usuariosRouter.get("/busca", async (req: Request, res: Response) => {
  try {
    const token = req.usuario?.uid;
    if (!token) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const termo = termoBusca(qDaQuery(req));
    if (!termo) {
      res.status(400).json({erro: "digite pelo menos 2 letras"});
      return;
    }

    const pessoas = (await usuarioRepository.buscarPorPrefixo(termo))
      .filter((pessoa) => pessoa.uid !== token);
    const ordenadas = ordenarBusca(termo, pessoas)
      .slice(0, LIMITE_BUSCA_PILOTOS);
    const mapa = await seguirRepository.vinculosCom(
      token,
      ordenadas.map((pessoa) => pessoa.uid),
    );
    const itens = ordenadas.map((pessoa) =>
      paraLinha(pessoa, flagsDe(mapa, pessoa.uid, false)),
    );
    res.json({itens});
  } catch (error) {
    responderErro(res, error);
  }
});

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

const listarVinculos = async (
  req: Request,
  res: Response,
  lado: "seguindo" | "seguidores",
): Promise<void> => {
  const token = req.usuario?.uid;
  if (!token) {
    res.status(401).json({erro: "Não autenticado"});
    return;
  }
  const uid = lerUid(req);
  const perfil = await usuarioRepository.buscarPorId(uid);
  if (!perfil) {
    res.status(404).json({erro: "Perfil não encontrado"});
    return;
  }

  const pagina = lado === "seguindo" ?
    await seguirRepository.listarSeguindo(uid, cursorDaQuery(req)) :
    await seguirRepository.listarSeguidores(uid, cursorDaQuery(req));
  if (!pagina.ok) {
    res.status(400).json({erro: "cursor inválido"});
    return;
  }

  const ids = pagina.vinculos.map((item) =>
    lado === "seguindo" ? item.seguidoId : item.seguidorId,
  );
  const [usuarios, mapa] = await Promise.all([
    usuarioRepository.buscarPorIds(ids),
    seguirRepository.vinculosCom(token, ids),
  ]);
  const porUid = new Map(usuarios.map((item) => [item.uid, item]));
  const forcarSeguido = lado === "seguindo" && uid === token;
  const itens: LinhaPiloto[] = [];
  for (const id of ids) {
    const usuario = porUid.get(id);
    if (!usuario) {
      continue;
    }
    itens.push(paraLinha(usuario, flagsDe(mapa, id, forcarSeguido)));
  }
  res.json({itens, proximoCursor: pagina.proximoCursor});
};

usuariosRouter.get("/:uid/seguindo", async (req: Request, res: Response) => {
  try {
    await listarVinculos(req, res, "seguindo");
  } catch (error) {
    responderErro(res, error);
  }
});

usuariosRouter.get("/:uid/seguidores", async (req: Request, res: Response) => {
  try {
    await listarVinculos(req, res, "seguidores");
  } catch (error) {
    responderErro(res, error);
  }
});

usuariosRouter.post("/:uid/seguir", async (req: Request, res: Response) => {
  try {
    const token = req.usuario?.uid;
    if (!token) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const uid = lerUid(req);
    if (!uid || uid === token) {
      res.status(400).json({erro: "não dá para seguir a si mesmo"});
      return;
    }

    const resultado = await seguirRepository.seguir(token, uid);
    if (resultado === "alvo_ausente" || resultado === "seguidor_ausente") {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }
    if (resultado === "criado") {
      try {
        const eu = await usuarioRepository.buscarPorId(token);
        await notificarNovoSeguidor(uid, token, apelidoExibicao(eu));
      } catch (error) {
        log.warn("Seguir", "Falha no push de novo seguidor", {
          uid: token,
          seguidoId: uid,
          ...erroDe(error),
        });
      }
      res.status(201).json({seguido: true});
      return;
    }
    res.status(200).json({seguido: true});
  } catch (error) {
    responderErro(res, error);
  }
});

usuariosRouter.delete("/:uid/seguir", async (req: Request, res: Response) => {
  try {
    const token = req.usuario?.uid;
    if (!token) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const uid = lerUid(req);
    if (!uid || uid === token) {
      res.status(400).json({erro: "não dá para seguir a si mesmo"});
      return;
    }

    await seguirRepository.deixarDeSeguir(token, uid);
    res.status(200).json({seguido: false});
  } catch (error) {
    responderErro(res, error);
  }
});

usuariosRouter.get("/:uid", async (req: Request, res: Response) => {
  try {
    const token = req.usuario?.uid;
    if (!token) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
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

    res.json(await paraPerfilPublico(perfil, token));
  } catch (error) {
    responderErro(res, error);
  }
});
