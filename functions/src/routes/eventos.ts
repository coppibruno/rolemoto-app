import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {exigirAdmin} from "../middleware/exigir-admin";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {filtrarEventosFeed} from "../lib/feed-filtros";
import {validarQueryGeoOpcional} from "../lib/feed-query";
import {log} from "../lib/log";
import {param} from "../lib/params";
import {resolverIntervaloQuando} from "../lib/quando";
import {eventoRepository} from "../repositories";
import type {Localizacao} from "../types/role";
import {
  ACESSOS_EVENTO,
  ATRACOES_EVENTO,
  TIPOS_EVENTO,
  type AcessoEvento,
  type AtracaoEvento,
  type EventoPublicacao,
  type TipoEvento,
} from "../types/evento";

/**
 * REST de eventos (destino fixo).
 *
 * GET    /eventos
 * GET    /eventos/:id
 * POST   /eventos   (admin do documento users)
 */
export const eventosRouter = Router();

eventosRouter.use(autenticar);
eventosRouter.use(rateLimitAutenticado);

const isTipo = (valor: unknown): valor is TipoEvento =>
  typeof valor === "string" && (TIPOS_EVENTO as string[]).includes(valor);

const isAcesso = (valor: unknown): valor is AcessoEvento =>
  typeof valor === "string" && (ACESSOS_EVENTO as string[]).includes(valor);

const LINK_INGRESSO_MAX = 2000;

const parseLinkIngresso = (
  valor: unknown,
  acesso: AcessoEvento,
): {ok: true; link: string | null} | {ok: false; erro: string} => {
  if (acesso !== "ingresso") {
    return {ok: true, link: null};
  }
  if (typeof valor !== "string" || !valor.trim()) {
    return {ok: false, erro: "linkIngresso é obrigatório"};
  }
  const link = valor.trim();
  if (link.length > LINK_INGRESSO_MAX) {
    return {ok: false, erro: "linkIngresso inválido"};
  }
  try {
    const url = new URL(link);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return {ok: false, erro: "linkIngresso inválido"};
    }
  } catch {
    return {ok: false, erro: "linkIngresso inválido"};
  }
  return {ok: true, link};
};

const isCoordLat = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor) && valor >= -90 && valor <= 90;

const isCoordLng = (valor: unknown): valor is number =>
  typeof valor === "number" &&
  Number.isFinite(valor) &&
  valor >= -180 &&
  valor <= 180;

const parseLocal = (valor: unknown): Localizacao | null => {
  if (!valor || typeof valor !== "object") {
    return null;
  }
  const o = valor as Record<string, unknown>;
  if (
    !isCoordLat(o.lat) ||
    !isCoordLng(o.lng) ||
    typeof o.endereco !== "string" ||
    o.endereco.trim().length < 3
  ) {
    return null;
  }
  if (o.nome !== undefined && o.nome !== null && typeof o.nome !== "string") {
    return null;
  }
  return {
    lat: o.lat,
    lng: o.lng,
    endereco: o.endereco.trim(),
    nome: typeof o.nome === "string" ? o.nome.trim() : "",
  };
};

const parseAtracoes = (valor: unknown): AtracaoEvento[] | null => {
  if (valor === undefined || valor === null) {
    return [];
  }
  if (!Array.isArray(valor)) {
    return null;
  }
  const vistos = new Set<string>();
  const itens: AtracaoEvento[] = [];
  for (const item of valor) {
    if (typeof item !== "string" || !(ATRACOES_EVENTO as string[]).includes(item)) {
      return null;
    }
    if (vistos.has(item)) {
      return null;
    }
    vistos.add(item);
    itens.push(item as AtracaoEvento);
  }
  return itens;
};

const parseIsoFuturo = (
  valor: unknown,
): {ok: true; iso: string} | {ok: false; motivo: "invalida" | "passado"} => {
  if (typeof valor !== "string" || !valor.trim()) {
    return {ok: false, motivo: "invalida"};
  }
  const instante = Date.parse(valor);
  if (Number.isNaN(instante)) {
    return {ok: false, motivo: "invalida"};
  }
  if (instante <= Date.now()) {
    return {ok: false, motivo: "passado"};
  }
  return {ok: true, iso: valor};
};

const parseEncerramento = (
  valor: unknown,
  aberturaIso: string,
): string | null | undefined => {
  if (valor === undefined || valor === null) {
    return null;
  }
  if (typeof valor !== "string" || !valor.trim()) {
    return undefined;
  }
  const instante = Date.parse(valor);
  if (Number.isNaN(instante) || instante <= Date.parse(aberturaIso)) {
    return undefined;
  }
  return valor;
};

type ResultadoValidacao =
  | {ok: true; dados: EventoPublicacao}
  | {ok: false; erro: string};

const validarBody = (body: unknown): ResultadoValidacao => {
  if (!body || typeof body !== "object") {
    return {ok: false, erro: "titulo é obrigatório"};
  }
  const bruto = body as Record<string, unknown>;

  const titulo = typeof bruto.titulo === "string" ? bruto.titulo.trim() : "";
  if (titulo.length < 3 || titulo.length > 80) {
    return {ok: false, erro: "titulo é obrigatório"};
  }

  if (!isTipo(bruto.tipo)) {
    return {ok: false, erro: "tipo inválido"};
  }

  const local = parseLocal(bruto.local);
  if (!local) {
    return {ok: false, erro: "local inválido"};
  }

  const abertura = parseIsoFuturo(bruto.dataHoraAbertura);
  if (!abertura.ok) {
    return {
      ok: false,
      erro:
        abertura.motivo === "passado" ?
          "a abertura precisa ser no futuro" :
          "dataHoraAbertura inválida",
    };
  }

  const encerramento = parseEncerramento(
    bruto.dataHoraEncerramento,
    abertura.iso,
  );
  if (encerramento === undefined) {
    return {ok: false, erro: "dataHoraEncerramento inválida"};
  }

  if (!isAcesso(bruto.acesso)) {
    return {ok: false, erro: "acesso inválido"};
  }

  const linkIngresso = parseLinkIngresso(bruto.linkIngresso, bruto.acesso);
  if (!linkIngresso.ok) {
    return {ok: false, erro: linkIngresso.erro};
  }

  const atracoes = parseAtracoes(bruto.atracoes);
  if (!atracoes) {
    return {ok: false, erro: "atracoes inválidas"};
  }

  if (typeof bruto.fotoCapaUrl !== "string" || !bruto.fotoCapaUrl.trim()) {
    return {ok: false, erro: "fotoCapaUrl é obrigatória"};
  }

  if (
    bruto.informacoes !== undefined &&
    bruto.informacoes !== null &&
    (typeof bruto.informacoes !== "string" || bruto.informacoes.trim().length > 2000)
  ) {
    return {ok: false, erro: "informacoes inválida"};
  }

  const informacoes =
    typeof bruto.informacoes === "string" ? bruto.informacoes.trim() : "";

  return {
    ok: true,
    dados: {
      titulo,
      tipo: bruto.tipo,
      local,
      dataHoraAbertura: abertura.iso,
      dataHoraEncerramento: encerramento,
      acesso: bruto.acesso,
      linkIngresso: linkIngresso.link,
      atracoes,
      fotoCapaUrl: bruto.fotoCapaUrl.trim(),
      informacoes,
    },
  };
};

eventosRouter.get("/", async (req: Request, res: Response) => {
  try {
    const query = validarQueryGeoOpcional(req);
    if (query && "erro" in query) {
      res.status(query.status).json({erro: query.erro});
      return;
    }

    if (!query) {
      const eventos = await eventoRepository.listarFuturos();
      res.json(eventos);
      return;
    }

    const intervalo = resolverIntervaloQuando(query.quando, query.data);
    const listados = await eventoRepository.listarFuturos({
      dataInicioIso: intervalo.dataInicioIso,
      dataFimIso: intervalo.dataFimIso,
    });
    const itens = filtrarEventosFeed(
      listados,
      {lat: query.lat, lng: query.lng, raioKm: query.raioKm},
      query.q,
    );
    res.json(itens);
  } catch (error) {
    responderErro(res, error);
  }
});

eventosRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const evento = await eventoRepository.buscarPorId(param(req, "id"));
    if (!evento) {
      res.status(404).json({erro: "Evento não encontrado"});
      return;
    }
    res.json(evento);
  } catch (error) {
    responderErro(res, error);
  }
});

eventosRouter.post("/", exigirAdmin, async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const validado = validarBody(req.body);
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }

    const criado = await eventoRepository.criar({
      ...validado.dados,
      criadorId: uid,
    });
    log.info("Evento", "Evento criado", {eventoId: criado.id, criadorId: uid});
    res.status(201).json(criado);
  } catch (error) {
    responderErro(res, error);
  }
});
