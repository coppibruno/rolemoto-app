import type {NextFunction, Request, Response} from "express";
import {usuarioRepository} from "../repositories";
import {responderErro} from "./errors";

/**
 * Exige `users/{uid}.admin === true`. Usar depois de `autenticar`.
 * Não consulta custom claim do token.
 */
export const exigirAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const perfil = await usuarioRepository.buscarPorId(uid);
    if (!perfil) {
      res.status(403).json({erro: "Perfil não encontrado"});
      return;
    }
    if (perfil.admin !== true) {
      res.status(403).json({erro: "Apenas administradores"});
      return;
    }

    next();
  } catch (error) {
    responderErro(res, error);
  }
};
