import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {usuarioRepository} from "../repositories";
import type {UsuarioCreate, UsuarioUpdate} from "../types/usuario";

/**
 * REST de perfil do usuário autenticado (sempre o próprio uid).
 *
 * GET    /perfil
 * POST   /perfil
 * PUT    /perfil
 * DELETE /perfil
 */
export const perfilRouter = Router();

perfilRouter.use(autenticar);

perfilRouter.get("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const perfil = await usuarioRepository.buscarPorId(uid);
    if (!perfil) {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }
    res.json(perfil);
  } catch (error) {
    responderErro(res, error);
  }
});

perfilRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const existente = await usuarioRepository.buscarPorId(uid);
    if (existente) {
      res.status(409).json({erro: "Perfil já existe"});
      return;
    }

    const body = req.body as Partial<UsuarioCreate>;
    if (!body.nome || !body.apelido || !body.moto || !body.pilotagem) {
      res.status(400).json({
        erro: "nome, apelido, moto e pilotagem são obrigatórios",
      });
      return;
    }

    const criado = await usuarioRepository.criar(uid, {
      nome: body.nome,
      apelido: body.apelido,
      moto: body.moto,
      pilotagem: body.pilotagem,
      fotoUrl: body.fotoUrl ?? "",
      cidade: body.cidade ?? "",
    });
    res.status(201).json(criado);
  } catch (error) {
    responderErro(res, error);
  }
});

perfilRouter.put("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const atualizado = await usuarioRepository.atualizar(
      uid,
      req.body as UsuarioUpdate,
    );
    if (!atualizado) {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }
    res.json(atualizado);
  } catch (error) {
    responderErro(res, error);
  }
});

perfilRouter.delete("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const removido = await usuarioRepository.remover(uid);
    if (!removido) {
      res.status(404).json({erro: "Perfil não encontrado"});
      return;
    }
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});
