import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {exigirAdmin} from "../middleware/exigir-admin";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {erroDe, log} from "../lib/log";
import {agendarAvisoEvento, agendarLembreteEvento} from "../lib/lembretes";
import {param} from "../lib/params";
import {
  ERRO_LOCALIZACAO_FORA_DO_SUL,
  pontoEstaNoSul,
} from "../lib/regiao-sul";
import {executarBuscaSugestoesEvento} from "../lib/sugestoes-evento/buscar-sugestoes-evento";
import {
  MotoClubConsultaError,
  SugestaoEventoJaDecididaError,
  SugestaoEventoNaoEncontradaError,
} from "../lib/sugestoes-evento/erros";
import {
  ID_SUGESTAO_EVENTO_RE,
  MAX_DURACAO_EVENTO_MS,
} from "../lib/sugestoes-evento/datas-evento";
import {sugestaoEventoRepository} from "../repositories";
import {
  ACESSOS_EVENTO,
  TIPOS_EVENTO,
  type AcessoEvento,
  type TipoEvento,
} from "../types/evento";
import type {SugestaoEvento} from "../types/sugestao-evento";

/**
 * Fila admin de eventos sugeridos.
 *
 * GET  /sugestoes-eventos
 * POST /sugestoes-eventos/buscar
 * POST /sugestoes-eventos/:id/aprovar
 * POST /sugestoes-eventos/:id/recusar
 */
export const sugestoesEventosRouter = Router();

sugestoesEventosRouter.use(autenticar);
sugestoesEventosRouter.use(rateLimitAutenticado);
sugestoesEventosRouter.use(exigirAdmin);

const ID_RE = ID_SUGESTAO_EVENTO_RE;

type Publicacao = {
  titulo: string;
  tipo: TipoEvento;
  acesso: AcessoEvento;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  informacoes: string;
  linkIngresso: string | null;
};

const isTipo = (valor: unknown): valor is TipoEvento =>
  typeof valor === "string" && (TIPOS_EVENTO as string[]).includes(valor);

const isAcesso = (valor: unknown): valor is AcessoEvento =>
  typeof valor === "string" && (ACESSOS_EVENTO as string[]).includes(valor);

const linkValido = (valor: string): boolean => {
  if (!valor || valor.length > 2000) {
    return false;
  }
  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const validarAprovacao = (
  sugestao: SugestaoEvento,
  body: unknown,
): {ok: true; dados: Publicacao} | {ok: false; erro: string} => {
  const bruto = body && typeof body === "object" ?
    body as Record<string, unknown> :
    {};
  const titulo = typeof bruto.titulo === "string" ?
    bruto.titulo.trim() :
    sugestao.titulo;
  if (titulo.length < 3 || titulo.length > 80) {
    return {ok: false, erro: "titulo é obrigatório"};
  }
  const tipo = bruto.tipo ?? sugestao.tipoSugerido;
  if (!isTipo(tipo)) {
    return {ok: false, erro: "tipo inválido"};
  }
  if (
    !pontoEstaNoSul(sugestao.local.lat, sugestao.local.lng) ||
    sugestao.local.endereco.trim().length < 3
  ) {
    return {ok: false, erro: ERRO_LOCALIZACAO_FORA_DO_SUL};
  }
  const abertura = typeof bruto.dataHoraAbertura === "string" ?
    bruto.dataHoraAbertura :
    sugestao.dataHoraAbertura;
  const instante = Date.parse(abertura);
  if (Number.isNaN(instante)) {
    return {ok: false, erro: "dataHoraAbertura inválida"};
  }
  if (instante <= Date.now()) {
    return {ok: false, erro: "a abertura precisa ser no futuro"};
  }
  const veioEncerramento = Object.prototype.hasOwnProperty.call(
    bruto,
    "dataHoraEncerramento",
  );
  const encerramentoBruto = veioEncerramento ?
    bruto.dataHoraEncerramento :
    sugestao.dataHoraEncerramento;
  let encerramento: string | null = null;
  if (encerramentoBruto !== undefined && encerramentoBruto !== null && encerramentoBruto !== "") {
    if (typeof encerramentoBruto !== "string") {
      return {ok: false, erro: "dataHoraEncerramento inválida"};
    }
    const fim = Date.parse(encerramentoBruto);
    if (Number.isNaN(fim) || fim <= instante) {
      return {ok: false, erro: "dataHoraEncerramento inválida"};
    }
    if (fim - instante > MAX_DURACAO_EVENTO_MS) {
      return {ok: false, erro: "o evento pode durar no máximo 7 dias"};
    }
    encerramento = encerramentoBruto;
  }
  const acesso = bruto.acesso ?? sugestao.acesso;
  if (!isAcesso(acesso)) {
    return {ok: false, erro: "acesso inválido"};
  }
  const linkBase = sugestao.linkIngresso || sugestao.urlOrigem;
  const linkIngresso = acesso === "ingresso" ? linkBase : null;
  if (acesso === "ingresso" && !linkValido(linkIngresso ?? "")) {
    return {ok: false, erro: "linkIngresso é obrigatório"};
  }
  if (!sugestao.fotoCapaUrl.trim()) {
    return {ok: false, erro: "fotoCapaUrl é obrigatória"};
  }
  const informacoes = typeof bruto.informacoes === "string" ?
    bruto.informacoes.trim() :
    sugestao.informacoes;
  if (informacoes.length > 2000) {
    return {ok: false, erro: "informacoes inválida"};
  }
  return {
    ok: true,
    dados: {
      titulo,
      tipo,
      acesso,
      dataHoraAbertura: abertura,
      dataHoraEncerramento: encerramento,
      informacoes,
      linkIngresso,
    },
  };
};

const responderDecisao = (res: Response, error: unknown): void => {
  if (error instanceof SugestaoEventoNaoEncontradaError) {
    res.status(404).json({erro: "Sugestão não encontrada"});
    return;
  }
  if (error instanceof SugestaoEventoJaDecididaError) {
    res.status(409).json({erro: "Sugestão já decidida"});
    return;
  }
  responderErro(res, error);
};

export const responderBuscaEventos = async (res: Response): Promise<void> => {
  try {
    const resultado = await executarBuscaSugestoesEvento();
    res.json(resultado);
  } catch (error) {
    if (error instanceof MotoClubConsultaError) {
      log.error("SugestaoEvento", "Agenda falhou", erroDe(error));
      res.status(502).json({erro: "Falha ao consultar a agenda"});
      return;
    }
    responderErro(res, error);
  }
};

sugestoesEventosRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const agora = Date.now();
    const itens = await sugestaoEventoRepository.listarPorStatus("pendente");
    res.json({
      itens: itens.filter((item) => Date.parse(item.dataHoraAbertura) > agora),
    });
  } catch (error) {
    responderErro(res, error);
  }
});

sugestoesEventosRouter.post("/buscar", async (_req: Request, res: Response) => {
  await responderBuscaEventos(res);
});

sugestoesEventosRouter.post("/:id/aprovar", async (req: Request, res: Response) => {
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
    const sugestao = await sugestaoEventoRepository.buscarPorId(id);
    if (!sugestao) {
      res.status(404).json({erro: "Sugestão não encontrada"});
      return;
    }
    if (sugestao.status !== "pendente") {
      res.status(409).json({erro: "Sugestão já decidida"});
      return;
    }
    const validado = validarAprovacao(sugestao, req.body);
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }
    const criado = await sugestaoEventoRepository.aprovar(id, {
      ...validado.dados,
      local: sugestao.local,
      fotoCapaUrl: sugestao.fotoCapaUrl,
      criadorId: uid,
    });
    await agendarAvisoEvento(
      {eventoId: criado.id, titulo: criado.titulo},
      criado.dataHoraAbertura,
    );
    await agendarLembreteEvento(
      {eventoId: criado.id, userId: uid, titulo: criado.titulo},
      criado.dataHoraAbertura,
    );
    log.info("SugestaoEvento", "Sugestão homologada", {id, eventoId: criado.id});
    res.status(201).json({eventoId: criado.id});
  } catch (error) {
    responderDecisao(res, error);
  }
});

sugestoesEventosRouter.post("/:id/recusar", async (req: Request, res: Response) => {
  try {
    const id = param(req, "id");
    if (!ID_RE.test(id)) {
      res.status(404).json({erro: "Sugestão não encontrada"});
      return;
    }
    await sugestaoEventoRepository.recusar(id);
    res.status(204).send();
  } catch (error) {
    responderDecisao(res, error);
  }
});
