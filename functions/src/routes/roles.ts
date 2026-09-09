import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {isDonoOuAdmin} from "../middleware/authorize";
import {responderErro} from "../middleware/errors";
import {param} from "../lib/params";
import {roleRepository} from "../repositories";
import type {RoleCreate, RoleUpdate} from "../types/role";

/**
 * REST de rolês.
 *
 * GET    /roles
 * GET    /roles/:id
 * POST   /roles
 * PUT    /roles/:id
 * DELETE /roles/:id
 */
export const rolesRouter = Router();

rolesRouter.use(autenticar);

rolesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const roles = await roleRepository.listar();
    res.json(roles);
  } catch (error) {
    responderErro(res, error);
  }
});

rolesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const role = await roleRepository.buscarPorId(param(req, "id"));
    if (!role) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }
    res.json(role);
  } catch (error) {
    responderErro(res, error);
  }
});

rolesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const body = req.body as Partial<RoleCreate>;
    if (!body.dataHoraSaida || !body.localSaida || !body.destinoFinal) {
      res.status(400).json({
        erro: "dataHoraSaida, localSaida e destinoFinal são obrigatórios",
      });
      return;
    }

    const criado = await roleRepository.criar({
      criadorId: uid,
      dataHoraSaida: body.dataHoraSaida,
      localSaida: body.localSaida,
      destinoFinal: body.destinoFinal,
      categoria: body.categoria ?? "tranquilo",
      categoriaMotos: body.categoriaMotos ?? "todas",
      fotoUrl: body.fotoUrl ?? "",
      participantes: [uid],
    });
    res.status(201).json(criado);
  } catch (error) {
    responderErro(res, error);
  }
});

rolesRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const usuario = req.usuario;
    if (!usuario) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const id = param(req, "id");
    const existente = await roleRepository.buscarPorId(id);
    if (!existente) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }
    if (!isDonoOuAdmin(usuario, existente.criadorId)) {
      res.status(403).json({
        erro: "Apenas o criador pode alterar este rolê",
      });
      return;
    }

    const atualizado = await roleRepository.atualizar(
      id,
      req.body as RoleUpdate,
    );
    res.json(atualizado);
  } catch (error) {
    responderErro(res, error);
  }
});

rolesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const usuario = req.usuario;
    if (!usuario) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const id = param(req, "id");
    const existente = await roleRepository.buscarPorId(id);
    if (!existente) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }
    if (!isDonoOuAdmin(usuario, existente.criadorId)) {
      res.status(403).json({
        erro: "Apenas o criador pode remover este rolê",
      });
      return;
    }

    await roleRepository.remover(id);
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});
