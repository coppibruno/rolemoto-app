import {Router, Request, Response} from "express";
import type {UserRecord} from "firebase-admin/auth";
import {adminAuth} from "../lib/firebase-admin";
import {enviarOobReset} from "../lib/enviar-oob-reset";
import {normalizarApelido, pareceEmail} from "../lib/identificador";
import {responderErro} from "../middleware/errors";
import {usuarioRepository} from "../repositories";

/**
 * Auth auxiliar — único router sem `autenticar`.
 *
 * POST /auth/resolver         { identificador } → { email }
 * POST /auth/recuperar-senha  { identificador } → 204
 */
export const authRouter = Router();

const temProviderSenha = (registro: UserRecord): boolean =>
  registro.providerData.some((provider) => provider.providerId === "password");

const resolverRegistro = async (
  identificador: string,
): Promise<UserRecord | null> => {
  if (pareceEmail(identificador)) {
    try {
      return await adminAuth.getUserByEmail(identificador.toLowerCase());
    } catch (error) {
      if ((error as {code?: string}).code === "auth/user-not-found") {
        return null;
      }
      throw error;
    }
  }

  const encontrados = await usuarioRepository.buscarPorApelido(identificador);
  if (encontrados.length !== 1) {
    return null;
  }

  try {
    return await adminAuth.getUser(encontrados[0].uid);
  } catch (error) {
    if ((error as {code?: string}).code === "auth/user-not-found") {
      return null;
    }
    throw error;
  }
};

authRouter.post("/resolver", async (req: Request, res: Response) => {
  try {
    const bruto = req.body?.identificador;
    const identificador =
      typeof bruto === "string" ? normalizarApelido(bruto) : "";

    if (!identificador || pareceEmail(identificador)) {
      res.status(400).json({erro: "identificador inválido"});
      return;
    }

    const encontrados = await usuarioRepository.buscarPorApelido(identificador);
    if (encontrados.length !== 1) {
      res.status(404).json({erro: "não encontrado"});
      return;
    }

    const registro = await adminAuth.getUser(encontrados[0].uid);
    if (!registro.email) {
      res.status(404).json({erro: "não encontrado"});
      return;
    }

    res.json({email: registro.email});
  } catch (error) {
    const codigo = (error as {code?: string}).code;
    if (codigo === "auth/user-not-found") {
      res.status(404).json({erro: "não encontrado"});
      return;
    }
    responderErro(res, error);
  }
});

authRouter.post("/recuperar-senha", async (req: Request, res: Response) => {
  try {
    const bruto = req.body?.identificador;
    if (typeof bruto !== "string" || !bruto.trim()) {
      res.status(400).json({erro: "identificador inválido"});
      return;
    }

    const identificador = normalizarApelido(bruto);
    if (!identificador) {
      res.status(400).json({erro: "identificador inválido"});
      return;
    }

    const registro = await resolverRegistro(identificador);
    if (!registro?.email || !temProviderSenha(registro)) {
      res.status(204).end();
      return;
    }

    await enviarOobReset(registro.email);
    res.status(204).end();
  } catch (error) {
    responderErro(res, error);
  }
});
