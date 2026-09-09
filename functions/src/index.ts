/**
 * Firebase Cloud Functions — Backend do Rolemoto
 *
 * Uma única function `api` com Express. Os recursos ficam em routers:
 * - /roles   → GET, POST, PUT, DELETE
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
import {perfilRouter} from "./routes/perfil";

setGlobalOptions({maxInstances: 10});

const app = express();
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    mensagem: "API do Rolemoto",
    rotas: ["/roles", "/perfil"],
  });
});

app.use("/roles", rolesRouter);
app.use("/perfil", perfilRouter);

export const api = onRequest({cors: true}, app);
