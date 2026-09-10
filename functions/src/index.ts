/**
 * Firebase Cloud Functions — Backend do Rolemoto
 *
 * Uma única function `api` com Express. Os recursos ficam em routers:
 * - /roles   → GET, POST, PUT, DELETE
 * - /roles/:id/participacao → GET, POST, PATCH, DELETE
 * - /roles/:id/feedback → POST
 * - /roles/:id/feedbacks → GET
 * - /feedback/pendente → GET
 * - /aprovacoes → GET, PATCH
 * - /perfil  → GET, POST, PUT, DELETE
 *
 * Local:  http://127.0.0.1:5001/rolemoto-bc47f/us-central1/api
 * Prod:   https://us-central1-rolemoto-bc47f.cloudfunctions.net/api
 *
 * Acesso a dados passa por repositórios (interfaces), não pelo Firestore
 * direto nas rotas.
 */
import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import express, {Request, Response} from "express";
import {rolesRouter} from "./routes/roles";
import {aprovacoesRouter} from "./routes/aprovacoes";
import {perfilRouter} from "./routes/perfil";
import {feedbackRouter} from "./routes/feedback";

setGlobalOptions({maxInstances: 10});

const app = express();
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    mensagem: "API do Rolemoto",
    rotas: [
      "/roles",
      "/roles/:id/modelo",
      "/roles/:id/feedback",
      "/roles/:id/feedbacks",
      "/feedback/pendente",
      "/aprovacoes",
      "/perfil",
      "/perfil/historico",
    ],
  });
});

app.use("/roles", rolesRouter);
app.use("/aprovacoes", aprovacoesRouter);
app.use("/perfil", perfilRouter);
app.use("/feedback", feedbackRouter);

export const api = onRequest({cors: true}, app);
