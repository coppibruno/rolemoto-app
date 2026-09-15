import type {NextFunction, Request, Response} from "express";
import {OAuth2Client} from "google-auth-library";
import {lembretesEnviarUrl} from "../lib/lembretes";
import {log} from "../lib/log";

const client = new OAuth2Client();

const projectId = (): string =>
  process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT ?? "rolemoto-bc47f";

const serviceAccountEsperada = (): string =>
  `${projectId()}@appspot.gserviceaccount.com`;

const emEmulator = (): boolean => process.env.FUNCTIONS_EMULATOR === "true";

/**
 * Exige Bearer OIDC emitido pelo Cloud Tasks (service account do projeto).
 * No emulator, a verificação é pulada.
 */
export const autenticarCloudTasks = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (emEmulator()) {
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    log.warn("CloudTasks", "Token OIDC ausente");
    res.status(401).json({erro: "Token OIDC ausente"});
    return;
  }

  const token = header.slice(7);
  const audience = lembretesEnviarUrl();

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    if (
      !email ||
      email !== serviceAccountEsperada() ||
      payload.email_verified !== true
    ) {
      log.warn("CloudTasks", "Service account inválida", {
        emailRecebido: email ?? null,
      });
      res.status(401).json({erro: "Service account inválida"});
      return;
    }
    next();
  } catch {
    log.warn("CloudTasks", "Token OIDC inválido");
    res.status(401).json({erro: "Token OIDC inválido"});
  }
};
