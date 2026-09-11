import {Router, Request, Response} from "express";
import {adminAuth} from "../lib/firebase-admin";
import {responderErro} from "../middleware/errors";
import {usuarioRepository} from "../repositories";

/**
 * Auth auxiliar — único router sem `autenticar`.
 *
 * POST /auth/resolver  { identificador } → { email }
 */
export const authRouter = Router();

const normalizarApelido = (valor: string): string =>
  valor.trim().replace(/^@+/, "");

const pareceEmail = (valor: string): boolean => valor.includes("@");

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
