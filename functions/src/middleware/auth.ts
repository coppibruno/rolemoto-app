import type {NextFunction, Request, Response} from "express";
import {adminAuth} from "../lib/firebase-admin";

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
    res.status(401).json({erro: "Token inválido ou expirado"});
  }
};
