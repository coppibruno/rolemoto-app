import type {NextFunction, Request, Response} from "express";
import {adminAuth} from "../lib/firebase-admin";
import {log} from "../lib/log";

/**
 * Exige `Authorization: Bearer <idToken>` do Firebase Auth.
 * Popula `req.usuario` com uid, email e custom claims.
 */
export const autenticar = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    log.warn("Auth", "Token ausente", {
      metodo: req.method,
      rota: req.path,
    });
    res.status(401).json({erro: "Token ausente"});
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    req.usuario = {
      uid: decoded.uid,
      email: decoded.email,
      claims: decoded,
    };
    next();
  } catch {
    log.warn("Auth", "Token inválido ou expirado", {
      metodo: req.method,
      rota: req.path,
    });
    res.status(401).json({erro: "Token inválido ou expirado"});
  }
};
