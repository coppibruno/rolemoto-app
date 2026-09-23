import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {log} from "../lib/log";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {dispositivoRepository} from "../repositories";
import {
  ehPlataformaDispositivo,
  type PlataformaDispositivo,
} from "../types/dispositivo";

/**
 * Tokens FCM do aparelho autenticado (coleção `dispositivos`).
 *
 * POST   /dispositivos
 * DELETE /dispositivos
 */
export const dispositivosRouter = Router();

dispositivosRouter.use(autenticar);
dispositivosRouter.use(rateLimitAutenticado);

const tokenDoBody = (body: unknown): string | null => {
  if (!body || typeof body !== "object") {
    return null;
  }
  const token = (body as {token?: unknown}).token;
  if (typeof token !== "string") {
    return null;
  }
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/** `undefined` = omitido (persiste `"web"`). */
const plataformaDoBody = (
  body: unknown,
): PlataformaDispositivo | undefined | "invalida" => {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  const raw = (body as {plataforma?: unknown}).plataforma;
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }
  return ehPlataformaDispositivo(raw) ? raw : "invalida";
};

dispositivosRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const token = tokenDoBody(req.body);
    if (!token) {
      res.status(400).json({erro: "token é obrigatório"});
      return;
    }

    const plataforma = plataformaDoBody(req.body);
    if (plataforma === "invalida") {
      res.status(400).json({erro: "plataforma inválida"});
      return;
    }

    const existente = await dispositivoRepository.buscarPorToken(token);
    const dispositivo = await dispositivoRepository.upsert(
      uid,
      token,
      plataforma ?? "web",
    );
    log.info("Dispositivo", existente ? "Token atualizado" : "Token registrado", {
      uid,
      plataforma: dispositivo.plataforma,
    });
    res.status(existente ? 200 : 201).json(dispositivo);
  } catch (error) {
    responderErro(res, error);
  }
});

dispositivosRouter.delete("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const token = tokenDoBody(req.body);
    if (!token) {
      res.status(400).json({erro: "token é obrigatório"});
      return;
    }

    const existente = await dispositivoRepository.buscarPorToken(token);
    if (!existente) {
      res.status(204).send();
      return;
    }
    if (existente.uid !== uid) {
      res.status(403).json({erro: "dispositivo de outro usuário"});
      return;
    }

    await dispositivoRepository.removerPorToken(token);
    log.info("Dispositivo", "Token removido", {uid});
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});
