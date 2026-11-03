import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {exigirAdmin} from "../middleware/exigir-admin";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {param} from "../lib/params";
import {validarConteudoEvento} from "../lib/validar-evento";
import {validarRegraSerie} from "../lib/serie-evento";
import {
  atualizarSerie,
  criarSerie,
  encerrarSerie,
  listarResumos,
  obterSerie,
  pausarSerie,
  pularData,
  retomarSerie,
} from "../lib/serie-evento-operacao";

/**
 * Encontros semanais. A série é a regra; cada data é um evento.
 *
 * GET    /series-evento
 * POST   /series-evento
 * GET    /series-evento/:id
 * PUT    /series-evento/:id
 * POST   /series-evento/:id/pausar
 * POST   /series-evento/:id/retomar
 * POST   /series-evento/:id/encerrar
 * POST   /series-evento/:id/excecoes
 */
export const seriesEventoRouter = Router();

seriesEventoRouter.use(autenticar);
seriesEventoRouter.use(rateLimitAutenticado);
seriesEventoRouter.use(exigirAdmin);

const uidDe = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

const lerRegra = (body: unknown) => {
  const conteudo = validarConteudoEvento(body);
  if (!conteudo.ok) {
    return conteudo;
  }
  const bruto = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const regra = validarRegraSerie(bruto, new Date());
  if (!regra.ok) {
    return regra;
  }
  return {ok: true as const, conteudo: conteudo.dados, regra: regra.regra};
};

seriesEventoRouter.get("/", async (_req: Request, res: Response) => {
  try {
    res.json(await listarResumos());
  } catch (error) {
    responderErro(res, error);
  }
});

seriesEventoRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = uidDe(req, res);
    if (!uid) {
      return;
    }
    const lido = lerRegra(req.body);
    if (!lido.ok) {
      res.status(400).json({erro: lido.erro});
      return;
    }
    const criado = await criarSerie(lido.conteudo, lido.regra, req.body, uid);
    if (!criado.ok) {
      res.status(criado.status).json({erro: criado.erro});
      return;
    }
    res.status(201).json(criado.dados);
  } catch (error) {
    responderErro(res, error);
  }
});

seriesEventoRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const detalhe = await obterSerie(param(req, "id"));
    if (!detalhe.ok) {
      res.status(detalhe.status).json({erro: detalhe.erro});
      return;
    }
    res.json(detalhe.dados);
  } catch (error) {
    responderErro(res, error);
  }
});

seriesEventoRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const lido = lerRegra(req.body);
    if (!lido.ok) {
      res.status(400).json({erro: lido.erro});
      return;
    }
    const atualizado = await atualizarSerie(param(req, "id"), lido.conteudo, lido.regra, req.body);
    if (!atualizado.ok) {
      res.status(atualizado.status).json({erro: atualizado.erro});
      return;
    }
    res.json(atualizado.dados);
  } catch (error) {
    responderErro(res, error);
  }
});

const responderAcao = async (
  res: Response,
  acao: () => Promise<
    {ok: true; dados: unknown} | {ok: false; status: number; erro: string}
  >,
) => {
  const resultado = await acao();
  if (!resultado.ok) {
    res.status(resultado.status).json({erro: resultado.erro});
    return;
  }
  res.json(resultado.dados);
};

seriesEventoRouter.post("/:id/pausar", async (req: Request, res: Response) => {
  try {
    await responderAcao(res, () => pausarSerie(param(req, "id")));
  } catch (error) {
    responderErro(res, error);
  }
});

seriesEventoRouter.post("/:id/retomar", async (req: Request, res: Response) => {
  try {
    await responderAcao(res, () => retomarSerie(param(req, "id")));
  } catch (error) {
    responderErro(res, error);
  }
});

seriesEventoRouter.post("/:id/encerrar", async (req: Request, res: Response) => {
  try {
    await responderAcao(res, () => encerrarSerie(param(req, "id")));
  } catch (error) {
    responderErro(res, error);
  }
});

seriesEventoRouter.post("/:id/excecoes", async (req: Request, res: Response) => {
  try {
    const ymd = req.body && typeof req.body === "object" ?
      (req.body as Record<string, unknown>).ymd :
      undefined;
    await responderAcao(res, () => pularData(param(req, "id"), ymd));
  } catch (error) {
    responderErro(res, error);
  }
});
