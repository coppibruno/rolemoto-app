import type {NextFunction, Request, Response} from "express";
import {adminAppCheck} from "../lib/firebase-admin";

const HEADER = "x-firebase-appcheck";

const emEmulator = (): boolean => process.env.FUNCTIONS_EMULATOR === "true";

/** App Check obrigatório só quando APP_CHECK_ENFORCE=true (e fora do emulator). */
const deveExigir = (): boolean => {
  if (emEmulator()) {
    return false;
  }
  return process.env.APP_CHECK_ENFORCE === "true";
};

const devePular = (req: Request): boolean => {
  if (req.method === "OPTIONS") {
    return true;
  }
  const caminho = req.path || req.url?.split("?")[0] || "";
  if (req.method === "GET" && (caminho === "/" || caminho === "")) {
    return true;
  }
  if (
    req.method === "POST" &&
    (caminho === "/lembretes/enviar" ||
      caminho.endsWith("/lembretes/enviar"))
  ) {
    return true;
  }
  return false;
};

/**
 * Verifica `X-Firebase-AppCheck` via Admin SDK.
 * Skip: GET /, POST /lembretes/enviar, emulator, APP_CHECK_ENFORCE≠true.
 */
export const verificarAppCheck = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!deveExigir() || devePular(req)) {
    next();
    return;
  }

  const token = req.header(HEADER);
  if (!token) {
    res.status(401).json({erro: "App Check ausente"});
    return;
  }

  try {
    await adminAppCheck.verifyToken(token);
    next();
  } catch {
    res.status(401).json({erro: "App Check inválido"});
  }
};
