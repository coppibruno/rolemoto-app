import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {exigirAdmin} from "../middleware/exigir-admin";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {erroDe, log} from "../lib/log";
import {param} from "../lib/params";
import {validarPublicacaoLocal} from "../lib/validar-local";
import {executarBuscaSugestoes} from "../lib/sugestoes-local/buscar-sugestoes-local";
import {
  FACETAS_BUSCA,
  facetasDoPedido,
  type FacetaBusca,
} from "../lib/sugestoes-local/facetas-busca";
import {
  completarFotosSugestoes,
  garantirFotoSugestao,
} from "../lib/sugestoes-local/garantir-foto-sugestao";
import {
  PlacesConsultaError,
  PlacesNaoConfiguradoError,
  SugestaoJaDecididaError,
  SugestaoNaoEncontradaError,
} from "../lib/sugestoes-local/erros";
import {sugestaoLocalRepository} from "../repositories";
import type {StatusSugestaoLocal} from "../types/sugestao-local";

/**
 * Fila admin de locais sugeridos.
 *
 * GET  /sugestoes-locais
 * POST /sugestoes-locais/buscar
 * POST /sugestoes-locais/:id/aprovar
 * POST /sugestoes-locais/:id/recusar
 */
export const sugestoesLocaisRouter = Router();

sugestoesLocaisRouter.use(autenticar);
sugestoesLocaisRouter.use(rateLimitAutenticado);
sugestoesLocaisRouter.use(exigirAdmin);

const ID_RE = /^[A-Za-z0-9_-]{4,200}$/;

const STATUSES: StatusSugestaoLocal[] = ["pendente", "aprovada", "recusada"];

const statusQuery = (valor: unknown): StatusSugestaoLocal | null => {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  if (bruto === undefined) {
    return "pendente";
  }
  if (typeof bruto === "string" && (STATUSES as string[]).includes(bruto)) {
    return bruto as StatusSugestaoLocal;
  }
  return null;
};

export const responderBuscaSugestoes = async (
  res: Response,
  facetas: readonly FacetaBusca[] = FACETAS_BUSCA,
): Promise<void> => {
  try {
    const resultado = await executarBuscaSugestoes(facetas);
    res.json(resultado);
  } catch (error) {
    if (error instanceof PlacesNaoConfiguradoError) {
      res.status(503).json({erro: "Places não configurado"});
      return;
    }
    if (error instanceof PlacesConsultaError) {
      log.error("SugestaoLocal", "Places falhou", erroDe(error));
      res.status(502).json({erro: "Falha ao consultar o Places"});
      return;
    }
    responderErro(res, error);
  }
};

const responderDecisao = (res: Response, error: unknown): void => {
  if (error instanceof SugestaoNaoEncontradaError) {
    res.status(404).json({erro: "Sugestão não encontrada"});
    return;
  }
  if (error instanceof SugestaoJaDecididaError) {
    res.status(409).json({erro: "Sugestão já decidida"});
    return;
  }
  responderErro(res, error);
};

sugestoesLocaisRouter.get("/", async (req: Request, res: Response) => {
  try {
    const status = statusQuery(req.query.status);
    if (!status) {
      res.status(400).json({erro: "status inválido"});
      return;
    }
    const itens = await sugestaoLocalRepository.listarPorStatus(status);
    const comFoto = status === "pendente" ? await completarFotosSugestoes(itens) : itens;
    res.json({itens: comFoto});
  } catch (error) {
    responderErro(res, error);
  }
});

sugestoesLocaisRouter.post("/buscar", async (req: Request, res: Response) => {
  const pedido = facetasDoPedido(req.body);
  if (!pedido.ok) {
    res.status(400).json({erro: "Filtro inválido"});
    return;
  }
  await responderBuscaSugestoes(res, pedido.facetas);
});

sugestoesLocaisRouter.post("/:id/aprovar", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    const id = param(req, "id");
    if (!ID_RE.test(id)) {
      res.status(404).json({erro: "Sugestão não encontrada"});
      return;
    }
    const sugestao = await sugestaoLocalRepository.buscarPorId(id);
    if (!sugestao) {
      res.status(404).json({erro: "Sugestão não encontrada"});
      return;
    }
    if (sugestao.status !== "pendente") {
      res.status(409).json({erro: "Sugestão já decidida"});
      return;
    }

    const comFoto = await garantirFotoSugestao(sugestao);
    const bruto = (req.body ?? {}) as Record<string, unknown>;
    const nome = typeof bruto.nome === "string" ? bruto.nome : sugestao.nome;
    const endereco = typeof bruto.endereco === "string" ? bruto.endereco : sugestao.endereco;
    const validado = validarPublicacaoLocal({
      nome,
      endereco,
      lat: sugestao.lat,
      lng: sugestao.lng,
      categoria: bruto.categoria,
      facilidades: bruto.facilidades ?? [],
      aberto24h: bruto.aberto24h,
      horarios: bruto.horarios,
      linkMaps: sugestao.linkMaps,
      fotoFachadaUrl: comFoto.fotoFachadaUrl,
    });
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }

    const local = await sugestaoLocalRepository.aprovar(id, {
      ...validado.dados,
      criadorId: uid,
      googlePlaceId: sugestao.placeId,
      fotoAtribuicao: comFoto.fotoAtribuicao,
    });
    log.info("SugestaoLocal", "Sugestão homologada", {placeId: id, localId: local.id});
    res.status(201).json({localId: local.id});
  } catch (error) {
    responderDecisao(res, error);
  }
});

sugestoesLocaisRouter.post("/:id/recusar", async (req: Request, res: Response) => {
  try {
    const id = param(req, "id");
    if (!ID_RE.test(id)) {
      res.status(404).json({erro: "Sugestão não encontrada"});
      return;
    }
    await sugestaoLocalRepository.recusar(id);
    res.status(204).send();
  } catch (error) {
    responderDecisao(res, error);
  }
});
