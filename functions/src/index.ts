/**
 * Firebase Cloud Functions — Backend do Rolemoto
 *
 * Uma única function `api` com Express. Os recursos ficam em routers:
 * - /auth/resolver → POST (público, sem Bearer)
 * - /auth/recuperar-senha → POST (público, sem Bearer)
 * - /publico/roles/:id → GET (público, sem Bearer)
 * - /meus-roles → GET
 * - /meus-roles/eventos → GET
 * - /meus-roles/locais → GET
 * - /roles   → GET, POST, PUT, DELETE
 * - /roles/:id/participacao → GET, POST, PATCH, DELETE
 * - /roles/:id/feedback → POST
 * - /roles/:id/feedbacks → GET
 * - /roles/:id/telemetria → GET, POST
 * - /feedback/pendente → GET
 * - /aprovacoes → GET, PATCH
 * - /dispositivos → POST, DELETE
 * - /lembretes/enviar → POST (Cloud Tasks, OIDC)
 * - /perfil  → GET, POST, PUT, DELETE
 * - /perfil/historico → GET
 * - /usuarios/:uid → GET
 * - /usuarios/:uid/historico → GET
 * - /eventos → GET, POST
 * - /eventos/:id/inscricao → GET, POST, DELETE
 * - /eventos/:id/avaliacoes → GET, POST
 * - /eventos/:id/avaliacao → GET
 * - /locais  → GET, POST
 * - /locais/:id/avaliacoes → GET, POST
 * - /locais/:id/avaliacao → GET
 * - /locais/:id/favorito → POST, DELETE
 * - /feed/contagens → GET
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
import {authRouter} from "./routes/auth";
import {rolesRouter} from "./routes/roles";
import {aprovacoesRouter} from "./routes/aprovacoes";
import {dispositivosRouter} from "./routes/dispositivos";
import {lembretesRouter} from "./routes/lembretes";
import {perfilRouter} from "./routes/perfil";
import {usuariosRouter} from "./routes/usuarios";
import {feedbackRouter} from "./routes/feedback";
import {rolesPublicoRouter} from "./routes/roles-publico";
import {meusRolesRouter} from "./routes/meus-roles";
import {eventosRouter} from "./routes/eventos";
import {locaisRouter} from "./routes/locais";
import {feedRouter} from "./routes/feed";
import {corsOrigins} from "./lib/cors-origins";

setGlobalOptions({maxInstances: 10});

const app = express();
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    mensagem: "API do Rolemoto",
    rotas: [
      "/auth/resolver",
      "/auth/recuperar-senha",
      "/publico/roles/:id",
      "/meus-roles",
      "/meus-roles/eventos",
      "/meus-roles/locais",
      "/roles",
      "/roles/:id/modelo",
      "/roles/:id/participantes",
      "/roles/:id/feedback",
      "/roles/:id/feedbacks",
      "/roles/:id/telemetria",
      "/feedback/pendente",
      "/aprovacoes",
      "/dispositivos",
      "/lembretes/enviar",
      "/perfil",
      "/perfil/historico",
      "/usuarios/:uid",
      "/usuarios/:uid/historico",
      "/eventos",
      "/eventos/:id",
      "/eventos/:id/participantes",
      "/eventos/:id/inscricao",
      "/eventos/:id/avaliacoes",
      "/eventos/:id/avaliacao",
      "/locais",
      "/locais/:id",
      "/locais/:id/avaliacoes",
      "/locais/:id/avaliacao",
      "/locais/:id/favorito",
      "/feed/contagens",
    ],
  });
});

app.use("/auth", authRouter);
app.use("/publico/roles", rolesPublicoRouter);
app.use("/meus-roles", meusRolesRouter);
app.use("/roles", rolesRouter);
app.use("/aprovacoes", aprovacoesRouter);
app.use("/dispositivos", dispositivosRouter);
app.use("/lembretes", lembretesRouter);
app.use("/perfil", perfilRouter);
app.use("/usuarios", usuariosRouter);
app.use("/feedback", feedbackRouter);
app.use("/eventos", eventosRouter);
app.use("/locais", locaisRouter);
app.use("/feed", feedRouter);

export const api = onRequest({cors: corsOrigins()}, app);
