import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {exigirAdmin} from "../middleware/exigir-admin";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {rankingDaConquista} from "../lib/conquistas";
import {garantirConquistasIniciais} from "../lib/conquistas-iniciais";
import {log} from "../lib/log";
import {param} from "../lib/params";
import {
  ERRO_FORA_DO_SUL,
  ERRO_NOME_REPETIDO,
  nomeEmUso,
  ordenarPorNome,
  paraAdmin,
  paraCatalogo,
  pinoFinalNoSul,
  validarConquistaCriacao,
  validarConquistaPatch,
} from "../lib/validar-conquista";
import {conquistaRepository} from "../repositories";

/**
 * Catálogo de conquistas de rota (SPEC 056). Sem DELETE: arquivar é `ativa: false`.
 *
 * GET   /conquistas        — ativas, cache do aparelho
 * GET   /conquistas/admin  — admin; roda o seed; ativas e arquivadas
 * GET   /conquistas/:id/ranking — o token e quem ele segue (SPEC 058)
 * POST  /conquistas        — admin
 * PATCH /conquistas/:id    — admin
 */
export const conquistasRouter = Router();

conquistasRouter.use(autenticar);
conquistasRouter.use(rateLimitAutenticado);

conquistasRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const ativas = (await conquistaRepository.listar()).filter((c) => c.ativa);
    res.json({itens: ordenarPorNome(ativas).map(paraCatalogo)});
  } catch (error) {
    responderErro(res, error);
  }
});

conquistasRouter.get("/admin", exigirAdmin, async (req: Request, res: Response) => {
  try {
    await garantirConquistasIniciais(req.usuario?.uid ?? "");
    const todas = await conquistaRepository.listar();
    res.json({itens: ordenarPorNome(todas).map(paraAdmin)});
  } catch (error) {
    responderErro(res, error);
  }
});

conquistasRouter.get("/:id/ranking", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const ranking = await rankingDaConquista(uid, param(req, "id"));
    if (!ranking) {
      res.status(404).json({erro: "Conquista não encontrada"});
      return;
    }
    res.json(ranking);
  } catch (error) {
    responderErro(res, error);
  }
});

conquistasRouter.post("/", exigirAdmin, async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const validado = validarConquistaCriacao(req.body);
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }
    if (nomeEmUso(await conquistaRepository.listar(), validado.dados.nome)) {
      res.status(409).json({erro: ERRO_NOME_REPETIDO});
      return;
    }
    const criada = await conquistaRepository.criar({...validado.dados, criadorId: uid});
    log.info("Conquista", "Conquista criada", {conquistaId: criada.id, criadorId: uid});
    res.status(201).json(paraAdmin(criada));
  } catch (error) {
    responderErro(res, error);
  }
});

conquistasRouter.patch("/:id", exigirAdmin, async (req: Request, res: Response) => {
  try {
    const id = param(req, "id");
    const validado = validarConquistaPatch(req.body);
    const catalogo = await conquistaRepository.listar();
    const atual = catalogo.find((c) => c.id === id);
    if (!atual) {
      res.status(404).json({erro: "Conquista não encontrada"});
      return;
    }
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }
    if (!pinoFinalNoSul(atual, validado.dados)) {
      res.status(400).json({erro: ERRO_FORA_DO_SUL});
      return;
    }
    if (validado.dados.nome && nomeEmUso(catalogo, validado.dados.nome, id)) {
      res.status(409).json({erro: ERRO_NOME_REPETIDO});
      return;
    }
    const atualizada = await conquistaRepository.atualizar(id, validado.dados);
    if (!atualizada) {
      res.status(404).json({erro: "Conquista não encontrada"});
      return;
    }
    log.info("Conquista", "Conquista atualizada", {
      conquistaId: id,
      uid: req.usuario?.uid,
      campos: Object.keys(validado.dados),
    });
    res.json(paraAdmin(atualizada));
  } catch (error) {
    responderErro(res, error);
  }
});
