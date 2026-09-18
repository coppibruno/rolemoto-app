import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {carregarHistoricoPublico} from "../lib/carregar-historico";
import {usuarioRepository} from "../repositories";
import type {PerfilPublico, Usuario} from "../types/usuario";

/**
 * Perfil público de qualquer piloto autenticado.
 *
 * GET /usuarios/:uid
 * GET /usuarios/:uid/historico
 */
export const usuariosRouter = Router();

usuariosRouter.use(autenticar);
usuariosRouter.use(rateLimitAutenticado);

const paraPerfilPublico = (usuario: Usuario): PerfilPublico => ({
  uid: usuario.uid,
  nome: usuario.nome,
  apelido: usuario.apelido,
  fotoUrl: usuario.fotoUrl,
  moto: usuario.moto,
  tipoMoto: usuario.tipoMoto,
  pilotagem: usuario.pilotagem,
  cidade: usuario.cidade,
  garupaFrequente: usuario.garupaFrequente,
});

const lerUid = (req: Request): string =>
  typeof req.params.uid === "string" ? req.params.uid.trim() : "";

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

    res.json(paraPerfilPublico(perfil));
  } catch (error) {
    responderErro(res, error);
  }
});
