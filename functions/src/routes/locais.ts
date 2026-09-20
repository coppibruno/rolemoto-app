import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {exigirAdmin} from "../middleware/exigir-admin";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {filtrarLocaisFeed} from "../lib/feed-filtros";
import {validarQueryGeoOpcional} from "../lib/feed-query";
import {log} from "../lib/log";
import {param} from "../lib/params";
import {
  localRepository,
  usuarioLocalFavoritoRepository,
  usuarioLocalFeedbackRepository,
} from "../repositories";
import {avaliacaoLocalRouter} from "./avaliacao-local";
import {favoritoLocalRouter} from "./favorito-local";
import type {
  CategoriaLocal,
  DiaSemana,
  FacilidadeLocal,
  HorarioDiaLocal,
  LocalPublicacao,
} from "../types/local";
import {
  CATEGORIAS_LOCAL,
  DIAS_SEMANA,
  FACILIDADES_LOCAL,
} from "../types/local";

/**
 * REST de locais oficiais (pontos permanentes).
 *
 * GET    /locais
 * GET    /locais/:id
 * POST   /locais   (admin do documento users)
 * GET|POST /locais/:id/avaliacoes
 * GET    /locais/:id/avaliacao
 * POST|DELETE /locais/:id/favorito
 */
export const locaisRouter = Router();

locaisRouter.use(autenticar);
locaisRouter.use(rateLimitAutenticado);
locaisRouter.use(avaliacaoLocalRouter);
locaisRouter.use(favoritoLocalRouter);

const idFeedbackLocal = (usuarioId: string, localId: string): string =>
  `${usuarioId}_${localId}`;

const marcarAvaliadosEFavoritos = async <T extends {id: string}>(
  itens: T[],
  uid: string,
): Promise<(T & {avaliado: boolean; favorito: boolean})[]> => {
  if (itens.length === 0) {
    return [];
  }
  const idsFeedback = itens.map((item) => idFeedbackLocal(uid, item.id));
  const [docs, favoritoIds] = await Promise.all([
    usuarioLocalFeedbackRepository.buscarPorIds(idsFeedback),
    usuarioLocalFavoritoRepository.listarLocalIdsPorUsuario(uid),
  ]);
  const avaliados = new Set(docs.map((doc) => doc.localId));
  const favoritos = new Set(favoritoIds);
  return itens.map((item) => ({
    ...item,
    avaliado: avaliados.has(item.id),
    favorito: favoritos.has(item.id),
  }));
};

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const isCategoria = (valor: unknown): valor is CategoriaLocal =>
  typeof valor === "string" && (CATEGORIAS_LOCAL as string[]).includes(valor);

const isCoordLat = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor) && valor >= -90 && valor <= 90;

const isCoordLng = (valor: unknown): valor is number =>
  typeof valor === "number" &&
  Number.isFinite(valor) &&
  valor >= -180 &&
  valor <= 180;

const parseFacilidades = (valor: unknown): FacilidadeLocal[] | null => {
  if (valor === undefined || valor === null) {
    return [];
  }
  if (!Array.isArray(valor)) {
    return null;
  }
  const vistos = new Set<string>();
  const itens: FacilidadeLocal[] = [];
  for (const item of valor) {
    if (typeof item !== "string" || !(FACILIDADES_LOCAL as string[]).includes(item)) {
      return null;
    }
    if (vistos.has(item)) {
      return null;
    }
    vistos.add(item);
    itens.push(item as FacilidadeLocal);
  }
  return itens;
};

const parseHorarios = (
  aberto24h: boolean,
  valor: unknown,
): HorarioDiaLocal[] | null => {
  if (aberto24h) {
    return [];
  }
  if (!Array.isArray(valor) || valor.length !== DIAS_SEMANA.length) {
    return null;
  }
  const vistos = new Set<number>();
  const itens: HorarioDiaLocal[] = [];
  for (const item of valor) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const o = item as Record<string, unknown>;
    if (typeof o.dia !== "number" || !(DIAS_SEMANA as number[]).includes(o.dia)) {
      return null;
    }
    if (vistos.has(o.dia)) {
      return null;
    }
    vistos.add(o.dia);
    if (typeof o.fechado !== "boolean") {
      return null;
    }
    if (o.fechado) {
      itens.push({
        dia: o.dia as DiaSemana,
        fechado: true,
        abertura: null,
        fechamento: null,
      });
      continue;
    }
    if (
      typeof o.abertura !== "string" ||
      typeof o.fechamento !== "string" ||
      !HORA_RE.test(o.abertura) ||
      !HORA_RE.test(o.fechamento)
    ) {
      return null;
    }
    itens.push({
      dia: o.dia as DiaSemana,
      fechado: false,
      abertura: o.abertura,
      fechamento: o.fechamento,
    });
  }
  if (vistos.size !== DIAS_SEMANA.length) {
    return null;
  }
  if (!itens.some((dia) => !dia.fechado)) {
    return null;
  }
  return itens.sort((a, b) => a.dia - b.dia);
};

const isUrlHttp = (valor: string): boolean => {
  if (valor.length > 500) {
    return false;
  }
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

type ResultadoValidacao =
  | {ok: true; dados: LocalPublicacao}
  | {ok: false; erro: string};

const validarBody = (body: unknown): ResultadoValidacao => {
  if (!body || typeof body !== "object") {
    return {ok: false, erro: "nome é obrigatório"};
  }
  const bruto = body as Record<string, unknown>;

  const nome = typeof bruto.nome === "string" ? bruto.nome.trim() : "";
  if (nome.length < 3 || nome.length > 80) {
    return {ok: false, erro: "nome é obrigatório"};
  }

  const endereco = typeof bruto.endereco === "string" ? bruto.endereco.trim() : "";
  if (endereco.length < 3) {
    return {ok: false, erro: "endereco inválido"};
  }

  if (!isCoordLat(bruto.lat) || !isCoordLng(bruto.lng)) {
    return {ok: false, erro: "local inválido"};
  }

  if (!isCategoria(bruto.categoria)) {
    return {ok: false, erro: "categoria inválida"};
  }

  const facilidades = parseFacilidades(bruto.facilidades);
  if (!facilidades) {
    return {ok: false, erro: "facilidades inválidas"};
  }

  if (typeof bruto.aberto24h !== "boolean") {
    return {ok: false, erro: "aberto24h inválido"};
  }

  const horarios = parseHorarios(bruto.aberto24h, bruto.horarios);
  if (!horarios) {
    return {ok: false, erro: "horario inválido"};
  }

  let linkMaps = "";
  if (bruto.linkMaps !== undefined && bruto.linkMaps !== null) {
    if (typeof bruto.linkMaps !== "string") {
      return {ok: false, erro: "linkMaps inválido"};
    }
    linkMaps = bruto.linkMaps.trim();
    if (linkMaps && !isUrlHttp(linkMaps)) {
      return {ok: false, erro: "linkMaps inválido"};
    }
  }

  let fotoFachadaUrl = "";
  if (bruto.fotoFachadaUrl !== undefined && bruto.fotoFachadaUrl !== null) {
    if (typeof bruto.fotoFachadaUrl !== "string") {
      return {ok: false, erro: "fotoFachadaUrl inválida"};
    }
    fotoFachadaUrl = bruto.fotoFachadaUrl;
  }

  return {
    ok: true,
    dados: {
      nome,
      endereco,
      lat: bruto.lat,
      lng: bruto.lng,
      categoria: bruto.categoria,
      facilidades,
      aberto24h: bruto.aberto24h,
      horarios,
      linkMaps,
      fotoFachadaUrl,
    },
  };
};

locaisRouter.get("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const query = validarQueryGeoOpcional(req);
    if (query && "erro" in query) {
      res.status(query.status).json({erro: query.erro});
      return;
    }

    const locais = await localRepository.listar();
    if (!query) {
      const enriquecidos = await marcarAvaliadosEFavoritos(locais, uid);
      res.json(enriquecidos);
      return;
    }

    const itens = filtrarLocaisFeed(
      locais,
      {lat: query.lat, lng: query.lng, raioKm: query.raioKm},
      query.q,
    );
    const enriquecidos = await marcarAvaliadosEFavoritos(itens, uid);
    res.json(enriquecidos);
  } catch (error) {
    responderErro(res, error);
  }
});

locaisRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const local = await localRepository.buscarPorId(param(req, "id"));
    if (!local) {
      res.status(404).json({erro: "Local não encontrado"});
      return;
    }

    const [feedback, favorito] = await Promise.all([
      usuarioLocalFeedbackRepository.buscarPorUsuarioELocal(uid, local.id),
      usuarioLocalFavoritoRepository.buscarPorUsuarioELocal(uid, local.id),
    ]);
    res.json({
      ...local,
      avaliado: feedback !== null,
      favorito: favorito !== null,
    });
  } catch (error) {
    responderErro(res, error);
  }
});

locaisRouter.post("/", exigirAdmin, async (req: Request, res: Response) => {
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

    const criado = await localRepository.criar({
      ...validado.dados,
      criadorId: uid,
    });
    log.info("Local", "Local criado", {localId: criado.id, criadorId: uid});
    res.status(201).json(criado);
  } catch (error) {
    responderErro(res, error);
  }
});
