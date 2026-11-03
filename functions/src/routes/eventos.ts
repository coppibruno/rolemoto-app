import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {exigirAdmin} from "../middleware/exigir-admin";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {filtrarEventosFeed} from "../lib/feed-filtros";
import {escolherUmaPorSerie} from "../lib/serie-evento";
import {ajustarOcorrencia, anexarRecorrencia, bodyTemAjuste} from "../lib/serie-evento-operacao";
import {validarPublicacaoEvento} from "../lib/validar-evento";
import {validarQueryGeoOpcional} from "../lib/feed-query";
import {erroDe, log} from "../lib/log";
import {param} from "../lib/params";
import {
  blocoParticipantesEvento,
  blocoVazio,
  enriquecerParticipantesEventos,
  listarParticipantesEvento,
} from "../lib/participantes";
import {resolverIntervaloQuando} from "../lib/quando";
import {
  eventoRepository,
  localRepository,
  usuarioEventoFeedbackRepository,
  usuarioEventoRepository,
} from "../repositories";
import {agendarAvisoEvento, agendarLembreteEvento} from "../lib/lembretes";
import {aoVivoPorEvento, detalheStoriesEvento, eventoEstaAoVivo} from "../lib/story-local";
import {inscricaoEventoRouter} from "./inscricao-evento";
import {avaliacaoEventoRouter} from "./avaliacao-evento";
import {storiesEventoRouter} from "./stories-evento";

/**
 * REST de eventos (destino fixo).
 *
 * GET    /eventos
 * GET    /eventos/:id
 * GET    /eventos/:id/participantes
 * POST   /eventos   (admin do documento users)
 * GET|POST|DELETE /eventos/:id/inscricao
 * GET|POST /eventos/:id/avaliacoes
 * GET    /eventos/:id/avaliacao
 */
export const eventosRouter = Router();

eventosRouter.use(autenticar);
eventosRouter.use(rateLimitAutenticado);
eventosRouter.use(inscricaoEventoRouter);
eventosRouter.use(avaliacaoEventoRouter);
eventosRouter.use(storiesEventoRouter);

const idFeedbackEvento = (usuarioId: string, eventoId: string): string =>
  `${usuarioId}_${eventoId}`;

const marcarInscritos = async <T extends {id: string}>(
  itens: T[],
  uid: string,
): Promise<(T & {inscrito: boolean})[]> => {
  if (itens.length === 0) {
    return [];
  }
  const inscricoes = await usuarioEventoRepository.listarPorUsuario(uid);
  const idsFeed = new Set(itens.map((item) => item.id));
  const inscritos = new Set(
    inscricoes
      .filter((inscricao) => idsFeed.has(inscricao.eventoId))
      .map((inscricao) => inscricao.eventoId),
  );
  return itens.map((item) => ({
    ...item,
    inscrito: inscritos.has(item.id),
  }));
};

const marcarAvaliados = async <T extends {id: string}>(
  itens: T[],
  uid: string,
): Promise<(T & {avaliado: boolean})[]> => {
  if (itens.length === 0) {
    return [];
  }
  const ids = itens.map((item) => idFeedbackEvento(uid, item.id));
  const docs = await usuarioEventoFeedbackRepository.buscarPorIds(ids);
  const avaliados = new Set(docs.map((doc) => doc.eventoId));
  return itens.map((item) => ({
    ...item,
    avaliado: avaliados.has(item.id),
  }));
};

const resolverLocalIdPost = async (
  body: unknown,
): Promise<{ok: true; localId: string | null} | {ok: false; erro: string}> => {
  if (!body || typeof body !== "object") {
    return {ok: true, localId: null};
  }
  const valor = (body as Record<string, unknown>).localId;
  if (valor === undefined || valor === null || valor === "") {
    return {ok: true, localId: null};
  }
  if (typeof valor !== "string") {
    return {ok: false, erro: "local não encontrado"};
  }
  const local = await localRepository.buscarPorId(valor.trim());
  if (!local) {
    return {ok: false, erro: "local não encontrado"};
  }
  return {ok: true, localId: local.id};
};

const resolverLocalIdPatch = async (
  body: unknown,
): Promise<{ok: true; localId: string | null} | {ok: false; erro: string}> => {
  if (!body || typeof body !== "object" || !("localId" in body)) {
    return {ok: false, erro: "localId é obrigatório"};
  }
  const valor = (body as Record<string, unknown>).localId;
  if (valor === null) {
    return {ok: true, localId: null};
  }
  if (typeof valor !== "string") {
    return {ok: false, erro: "localId é obrigatório"};
  }
  const id = valor.trim();
  if (!id) {
    return {ok: false, erro: "local não encontrado"};
  }
  const local = await localRepository.buscarPorId(id);
  if (!local) {
    return {ok: false, erro: "local não encontrado"};
  }
  return {ok: true, localId: local.id};
};

const comAoVivo = async <T extends {id: string; localId: string | null}>(
  itens: T[],
): Promise<Array<T & {aoVivo: boolean}>> => {
  if (itens.length === 0) {
    return [];
  }
  const mapa = await aoVivoPorEvento(itens);
  return itens.map((item) => ({
    ...item,
    aoVivo: mapa.get(item.id) ?? false,
  }));
};

eventosRouter.get("/", async (req: Request, res: Response) => {
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

    if (!query) {
      const eventos = escolherUmaPorSerie(
        await eventoRepository.listarFuturos(),
        new Date(),
      ).sort((a, b) => a.dataHoraAbertura.localeCompare(b.dataHoraAbertura));
      const [comInscrito, participantesPorEvento] = await Promise.all([
        marcarInscritos(eventos, uid),
        enriquecerParticipantesEventos(eventos.map((e) => e.id)),
      ]);
      const comAvaliado = await marcarAvaliados(comInscrito, uid);
      const comStory = await comAoVivo(comAvaliado);
      const comRecorrencia = await anexarRecorrencia(
        comStory.map((item) => ({
          ...item,
          participantes: participantesPorEvento.get(item.id) ?? blocoVazio(),
        })),
      );
      res.json(comRecorrencia);
      return;
    }

    const intervalo = resolverIntervaloQuando(query.quando, query.data);
    const listados = await eventoRepository.listarFuturos({
      dataInicioIso: intervalo.dataInicioIso,
      dataFimIso: intervalo.dataFimIso,
    });
    const itens = escolherUmaPorSerie(
      filtrarEventosFeed(
        listados,
        {lat: query.lat, lng: query.lng, raioKm: query.raioKm},
        query.q,
      ),
      new Date(),
    ).sort((a, b) => a.dataHoraAbertura.localeCompare(b.dataHoraAbertura));
    const [comInscrito, participantesPorEvento] = await Promise.all([
      marcarInscritos(itens, uid),
      enriquecerParticipantesEventos(itens.map((e) => e.id)),
    ]);
    const comAvaliado = await marcarAvaliados(comInscrito, uid);
    const comStory = await comAoVivo(comAvaliado);
    const comRecorrencia = await anexarRecorrencia(
      comStory.map((item) => ({
        ...item,
        participantes: participantesPorEvento.get(item.id) ?? blocoVazio(),
      })),
    );
    res.json(comRecorrencia);
  } catch (error) {
    responderErro(res, error);
  }
});

eventosRouter.get("/:id/participantes", async (req: Request, res: Response) => {
  try {
    if (!req.usuario?.uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const evento = await eventoRepository.buscarPorId(param(req, "id"));
    if (!evento) {
      res.status(404).json({erro: "Evento não encontrado"});
      return;
    }

    const lista = await listarParticipantesEvento(evento.id);
    res.json(lista);
  } catch (error) {
    responderErro(res, error);
  }
});

eventosRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const evento = await eventoRepository.buscarPorId(param(req, "id"));
    if (!evento) {
      res.status(404).json({erro: "Evento não encontrado"});
      return;
    }

    const [inscricao, total, feedback, participantes, stories] = await Promise.all([
      usuarioEventoRepository.buscarPorUsuarioEEvento(uid, evento.id),
      usuarioEventoRepository.contarPorEvento(evento.id),
      usuarioEventoFeedbackRepository.buscarPorUsuarioEEvento(uid, evento.id),
      blocoParticipantesEvento(evento.id),
      detalheStoriesEvento(evento).catch((error) => {
        log.warn("Evento", "Stories do detalhe indisponíveis", erroDe(error));
        return {storiesAtivas: 0, podePostarStory: eventoEstaAoVivo(evento)};
      }),
    ]);

    const [resposta] = await anexarRecorrencia([{
      ...evento,
      inscrito: inscricao !== null,
      inscritos: {total},
      avaliado: feedback !== null,
      participantes,
      storiesAtivas: stories.storiesAtivas,
      podePostarStory: stories.podePostarStory,
    }]);
    res.json(resposta);
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

    const validado = validarPublicacaoEvento(req.body);
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }

    const localId = await resolverLocalIdPost(req.body);
    if (!localId.ok) {
      res.status(400).json({erro: localId.erro});
      return;
    }

    const criado = await eventoRepository.criar({
      ...validado.dados,
      localId: localId.localId,
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
    log.info("Evento", "Evento criado", {eventoId: criado.id, criadorId: uid});
    res.status(201).json(criado);
  } catch (error) {
    responderErro(res, error);
  }
});

eventosRouter.patch("/:id", exigirAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.usuario?.uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    if (bodyTemAjuste(req.body)) {
      if (req.body && typeof req.body === "object" && "localId" in req.body) {
        res.status(400).json({erro: "envie o ajuste da data separado do ponto"});
        return;
      }
      const ajustado = await ajustarOcorrencia(param(req, "id"), req.body);
      if (!ajustado.ok) {
        res.status(ajustado.status).json({erro: ajustado.erro});
        return;
      }
      res.json(ajustado.dados);
      return;
    }

    const localId = await resolverLocalIdPatch(req.body);
    if (!localId.ok) {
      res.status(400).json({erro: localId.erro});
      return;
    }

    const atualizado = await eventoRepository.atualizarLocalId(
      param(req, "id"),
      localId.localId,
    );
    if (!atualizado) {
      res.status(404).json({erro: "Evento não encontrado"});
      return;
    }
    res.json(atualizado);
  } catch (error) {
    responderErro(res, error);
  }
});
