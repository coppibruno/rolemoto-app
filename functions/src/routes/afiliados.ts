import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {exigirAdmin} from "../middleware/exigir-admin";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {
  ERRO_CODIGO,
  ERRO_CODIGO_EM_USO,
  ERRO_NOME,
  codigoAfiliado,
  nomeAfiliado,
} from "../lib/afiliado";
import {log} from "../lib/log";
import {param} from "../lib/params";
import {afiliadoRepository} from "../repositories";

/**
 * Links de afiliado — só admin. Sem DELETE: os números ficam.
 *
 * GET   /afiliados
 * POST  /afiliados
 * PATCH /afiliados/:codigo — só `{nome}`
 */
export const afiliadosRouter = Router();

afiliadosRouter.use(autenticar);
afiliadosRouter.use(rateLimitAutenticado);
afiliadosRouter.use(exigirAdmin);

afiliadosRouter.get("/", async (_req: Request, res: Response) => {
  try {
    res.json({itens: await afiliadoRepository.listar()});
  } catch (error) {
    responderErro(res, error);
  }
});

afiliadosRouter.post("/", async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const codigo = codigoAfiliado(body.codigo);
    if (!codigo) {
      res.status(400).json({erro: ERRO_CODIGO});
      return;
    }
    const nome = nomeAfiliado(body.nome);
    if (!nome) {
      res.status(400).json({erro: ERRO_NOME});
      return;
    }
    const criado = await afiliadoRepository.criar(codigo, nome);
    if (!criado) {
      res.status(409).json({erro: ERRO_CODIGO_EM_USO});
      return;
    }
    log.info("Afiliado", "Código criado", {codigo, uid: req.usuario?.uid});
    res.status(201).json(criado);
  } catch (error) {
    responderErro(res, error);
  }
});

afiliadosRouter.patch("/:codigo", async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const chaves = Object.keys(body);
    if (chaves.length !== 1 || chaves[0] !== "nome") {
      res.status(400).json({erro: "só o nome muda"});
      return;
    }
    const nome = nomeAfiliado(body.nome);
    if (!nome) {
      res.status(400).json({erro: ERRO_NOME});
      return;
    }
    const codigo = codigoAfiliado(param(req, "codigo"));
    const atualizado = codigo ? await afiliadoRepository.atualizarNome(codigo, nome) : null;
    if (!atualizado) {
      res.status(404).json({erro: "Link não encontrado"});
      return;
    }
    res.json(atualizado);
  } catch (error) {
    responderErro(res, error);
  }
});
