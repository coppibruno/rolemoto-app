import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {
  rateLimitAutenticado,
  rateLimitPontoTelemetria,
} from "../middleware/rate-limit";
import {param} from "../lib/params";
import {
  parseLimiteTelemetria,
  validarBodyRoleTelemetria,
} from "../lib/role-telemetria";
import {
  HEADER_SESSAO_TOKEN,
  criarTelemetriaSessao,
  ingerirPontoSessao,
  sessaoParaResposta,
} from "../lib/telemetria-sessao";
import {
  roleTelemetriaRepository,
  telemetriaSessaoRepository,
} from "../repositories";

/**
 * Telemetria GPS de passeio próprio (standalone).
 *
 * POST /telemetria/sessao/:id/ponto — Capgo native (token de sessão)
 * POST /telemetria/sessao — abre sessão ao vivo (Bearer)
 * GET  /telemetria/sessao/:id — agregados ao vivo (Bearer)
 * DELETE /telemetria/sessao/:id — encerra sessão ao vivo (Bearer)
 * POST /telemetria
 * GET  /telemetria
 * GET  /telemetria/:id
 */
export const telemetriaRouter = Router();

const uidAutenticado = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

const tokenDoHeader = (req: Request): string | null => {
  const bruto = req.headers[HEADER_SESSAO_TOKEN];
  if (typeof bruto === "string" && bruto.trim()) {
    return bruto.trim();
  }
  if (Array.isArray(bruto) && bruto[0]?.trim()) {
    return bruto[0].trim();
  }
  return null;
};

/** Ingestão nativa Capgo — sem Bearer Firebase (JWT expira com tela off). */
telemetriaRouter.post(
  "/sessao/:id/ponto",
  rateLimitPontoTelemetria,
  async (req: Request, res: Response) => {
    try {
      const token = tokenDoHeader(req);
      if (!token) {
        res.status(401).json({erro: "Token de sessão ausente"});
        return;
      }
      const resultado = await ingerirPontoSessao(
        param(req, "id"),
        token,
        (req.body ?? {}) as Record<string, unknown>,
      );
      if (resultado === "ok") {
        res.status(204).send();
        return;
      }
      if (resultado === "body_invalido") {
        res.status(400).json({erro: "Ponto GPS inválido"});
        return;
      }
      if (resultado === "token_invalido") {
        res.status(401).json({erro: "Token de sessão inválido"});
        return;
      }
      if (resultado === "expirada") {
        res.status(410).json({erro: "Sessão expirada"});
        return;
      }
      res.status(404).json({erro: "Sessão não encontrada"});
    } catch (error) {
      responderErro(res, error);
    }
  },
);

telemetriaRouter.use(autenticar);
telemetriaRouter.use(rateLimitAutenticado);

telemetriaRouter.post("/sessao", async (req: Request, res: Response) => {
  try {
    const uid = uidAutenticado(req, res);
    if (!uid) {
      return;
    }
    const criada = await criarTelemetriaSessao(uid);
    res.status(201).json(criada);
  } catch (error) {
    responderErro(res, error);
  }
});

telemetriaRouter.get("/sessao/:id", async (req: Request, res: Response) => {
  try {
    const uid = uidAutenticado(req, res);
    if (!uid) {
      return;
    }
    const doc = await telemetriaSessaoRepository.buscarPorId(param(req, "id"));
    if (!doc || doc.usuarioId !== uid) {
      res.status(404).json({erro: "Sessão não encontrada"});
      return;
    }
    res.json(sessaoParaResposta(doc));
  } catch (error) {
    responderErro(res, error);
  }
});

telemetriaRouter.delete("/sessao/:id", async (req: Request, res: Response) => {
  try {
    const uid = uidAutenticado(req, res);
    if (!uid) {
      return;
    }
    const doc = await telemetriaSessaoRepository.buscarPorId(param(req, "id"));
    if (!doc || doc.usuarioId !== uid) {
      res.status(404).json({erro: "Sessão não encontrada"});
      return;
    }
    await telemetriaSessaoRepository.excluir(doc.id);
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});

telemetriaRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = uidAutenticado(req, res);
    if (!uid) {
      return;
    }

    const validado = validarBodyRoleTelemetria(
      (req.body ?? {}) as Record<string, unknown>,
    );
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }

    const criado = await roleTelemetriaRepository.criar({
      usuarioId: uid,
      ...validado.dados,
    });
    res.status(201).json(criado);
  } catch (error) {
    responderErro(res, error);
  }
});

telemetriaRouter.get("/", async (req: Request, res: Response) => {
  try {
    const uid = uidAutenticado(req, res);
    if (!uid) {
      return;
    }

    const lista = await roleTelemetriaRepository.listarPorUsuario(uid, {
      limite: parseLimiteTelemetria(req.query.limite),
    });
    res.json(lista);
  } catch (error) {
    responderErro(res, error);
  }
});

telemetriaRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const uid = uidAutenticado(req, res);
    if (!uid) {
      return;
    }

    const doc = await roleTelemetriaRepository.buscarPorId(param(req, "id"));
    if (!doc) {
      res.status(404).json({erro: "Telemetria não encontrada"});
      return;
    }
    res.json(doc);
  } catch (error) {
    responderErro(res, error);
  }
});
