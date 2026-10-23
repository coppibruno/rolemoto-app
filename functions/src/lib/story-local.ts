import {apelidoExibicao} from "./apelido";
import {RAIO_CHECKIN_KM, validarBodyCheckin} from "./checkin-local";
import {adminStorage} from "./firebase-admin";
import {filtrarEventosFeed, filtrarLocaisFeed} from "./feed-filtros";
import {haversineKm} from "./geo";
import {erroDe, log} from "./log";
import {notificarStory} from "./notificacoes";
import {ymdSaoPaulo} from "./quando";
import {
  dispositivoRepository,
  eventoRepository,
  localRepository,
  storyLocalRepository,
  usuarioEventoRepository,
  usuarioLocalFavoritoRepository,
  usuarioRepository,
} from "../repositories";
import type {Evento} from "../types/evento";
import type {Local} from "../types/local";
import type {
  AlbumStory,
  AnelStory,
  EventoAoVivoResumo,
  ListaStories,
  MencaoStory,
  StoryLocal,
  StoryPublica,
  StoryVisto,
} from "../types/story-local";
import type {Usuario} from "../types/usuario";

const TETO_FOTOS = 5;
const TETO_LISTA = 50;
const TETO_ANEIS = 20;
const TETO_PUSH = 100;
const LOTE_AVISO_EVENTO = 20;
const JANELA_MS = 24 * 60 * 60 * 1000;
const LOTE_RECENTES = 200;

const ERRO_FOTO = "foto inválida";
const ERRO_RAIO = "Chegue mais perto para postar a foto";
const ERRO_TETO_PONTO = "Você já postou 5 fotos neste ponto hoje";
const ERRO_TETO_ENCONTRO = "Você já postou 5 fotos neste encontro hoje";
const ERRO_TETO_PERFIL = "Você já postou 5 fotos no seu perfil hoje";
const ERRO_JANELA = "Este encontro não está rolando agora";
const ERRO_STORY = "Story não encontrada";
const ERRO_AUTOR = "só o autor apaga";

const EXTENSOES = new Set(["jpg", "jpeg", "png", "webp"]);

export type GeoAneis = {
  lat: number;
  lng: number;
  raioKm?: 25 | 50 | 100;
};

type Falha = {ok: false; status: number; erro: string};
type Pin = {lat: number; lng: number};
type AnelInterno = AnelStory & {recenteEm: string};

export const eventoEstaAoVivo = (evento: Evento, agora = new Date()): boolean => {
  const ms = agora.getTime();
  const abertura = Date.parse(evento.dataHoraAbertura);
  const fim = Date.parse(evento.dataHoraEncerramento ?? evento.dataHoraAbertura);
  if (!Number.isFinite(abertura) || !Number.isFinite(fim)) {
    return false;
  }
  return abertura <= ms && ms < fim;
};

const expirada = (story: StoryLocal, agora = Date.now()): boolean =>
  Date.parse(story.expiresAt) <= agora;

const idVistoLocal = (uid: string, localId: string): string =>
  `${uid}_local_${localId}`;

const idVistoEvento = (uid: string, eventoId: string): string =>
  `${uid}_evento_${eventoId}`;

const cortar = (texto: string): string =>
  texto.length <= 60 ? texto : texto.slice(0, 60);

const paraPublica = (
  story: StoryLocal,
  usuario: Usuario | null,
): StoryPublica => ({
  id: story.id,
  album: story.album,
  localId: story.localId,
  eventoId: story.eventoId,
  fotoUrl: story.fotoUrl,
  createdAt: story.createdAt,
  expiresAt: story.expiresAt,
  marcaX: story.marcaX,
  marcaY: story.marcaY,
  autor: {
    uid: story.usuarioId,
    apelido: apelidoExibicao(usuario),
    fotoUrl: usuario?.fotoUrl ?? "",
  },
  mencao: null,
});

const resumo = (evento: Evento | null): EventoAoVivoResumo | null =>
  evento ? {id: evento.id, titulo: evento.titulo} : null;

export const validarFotoStory = (
  fotoUrl: unknown,
  prefixo: string,
): {ok: true; storagePath: string} | {ok: false} => {
  if (typeof fotoUrl !== "string" || !fotoUrl.trim()) {
    return {ok: false};
  }
  let url: URL;
  try {
    url = new URL(fotoUrl.trim());
  } catch {
    return {ok: false};
  }
  const emulator = process.env.FUNCTIONS_EMULATOR === "true";
  const esquemaOk = url.protocol === "https:" ||
    (emulator && url.protocol === "http:");
  if (!esquemaOk) {
    return {ok: false};
  }
  const marcador = "/o/";
  const indice = url.pathname.indexOf(marcador);
  if (indice < 0) {
    return {ok: false};
  }
  let caminho = url.pathname.slice(indice + marcador.length);
  try {
    caminho = decodeURIComponent(caminho);
  } catch {
    return {ok: false};
  }
  const base = `${prefixo}/`;
  if (!caminho.startsWith(base)) {
    return {ok: false};
  }
  const arquivo = caminho.slice(base.length);
  if (!arquivo || arquivo.includes("/") || arquivo.includes("..")) {
    return {ok: false};
  }
  if (!/^[\w.-]+$/.test(arquivo)) {
    return {ok: false};
  }
  const ext = arquivo.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSOES.has(ext)) {
    return {ok: false};
  }
  return {ok: true, storagePath: caminho};
};

const foraDoRaio = (lat: number, lng: number, pins: Pin[]): boolean =>
  !pins.some((pin) => haversineKm(lat, lng, pin.lat, pin.lng) <= RAIO_CHECKIN_KM);

const fotoDoBody = (body: unknown): unknown => {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  return (body as Record<string, unknown>).fotoUrl;
};

const limitarEixo = (valor: number, min: number, max: number): number =>
  Math.round(Math.min(max, Math.max(min, valor)) * 10) / 10;

/** Mesmo intervalo do composer: a marca não entra no topo nem no botão de publicar. */
const posicaoDoBody = (
  body: unknown,
): {marcaX: number; marcaY: number} | null => {
  if (!body || typeof body !== "object") {
    return null;
  }
  const bruto = body as Record<string, unknown>;
  const x = bruto.marcaX;
  const y = bruto.marcaY;
  if (typeof x !== "number" || typeof y !== "number") {
    return null;
  }
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return {
    marcaX: limitarEixo(x, 12, 88),
    marcaY: limitarEixo(y, 20, 76),
  };
};

const porCriacao = (stories: StoryLocal[]): StoryLocal[] =>
  [...stories].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );

export const apagarObjetoStory = async (storagePath: string): Promise<void> => {
  if (!storagePath) {
    return;
  }
  try {
    await adminStorage.bucket().file(storagePath).delete({ignoreNotFound: true});
  } catch (error) {
    log.warn("Story", "Falha ao apagar objeto", {storagePath, ...erroDe(error)});
  }
};

const eventoQueVeste = async (localId: string): Promise<Evento | null> => {
  const candidatos = await eventoRepository.listarPorLocalId(localId, 5);
  return candidatos.find((evento) => eventoEstaAoVivo(evento)) ?? null;
};

const hidratar = async (stories: StoryLocal[]): Promise<StoryPublica[]> => {
  const uids = [...new Set(stories.map((story) => story.usuarioId))];
  const usuarios = await usuarioRepository.buscarPorIds(uids);
  const porUid = new Map(usuarios.map((usuario) => [usuario.uid, usuario]));
  return stories.map((story) =>
    paraPublica(story, porUid.get(story.usuarioId) ?? null),
  );
};

const nomesMencao = async (
  stories: StoryLocal[],
): Promise<Map<string, MencaoStory>> => {
  const locaisIds = [...new Set(stories.flatMap((story) =>
    story.localId ? [story.localId] : [],
  ))];
  const eventosIds = [...new Set(stories.flatMap((story) =>
    story.eventoId ? [story.eventoId] : [],
  ))];
  const [locais, eventos] = await Promise.all([
    localRepository.buscarPorIds(locaisIds),
    eventoRepository.buscarPorIds(eventosIds),
  ]);
  const mapa = new Map<string, MencaoStory>();
  locais.forEach((local) => {
    mapa.set(`local:${local.id}`, {tipo: "local", id: local.id, nome: local.nome});
  });
  eventos.forEach((evento) => {
    mapa.set(`evento:${evento.id}`, {
      tipo: "evento",
      id: evento.id,
      nome: evento.titulo,
    });
  });
  return mapa;
};

const comMencao = (
  stories: StoryPublica[],
  mapa: Map<string, MencaoStory>,
): StoryPublica[] =>
  stories.map((story) => {
    const chave = story.eventoId ?
      `evento:${story.eventoId}` :
      story.localId ? `local:${story.localId}` : "";
    return {...story, mencao: mapa.get(chave) ?? null};
  });

const publicarLista = async (stories: StoryLocal[]): Promise<StoryPublica[]> => {
  const [publicas, mapa] = await Promise.all([
    hidratar(stories),
    nomesMencao(stories),
  ]);
  return comMencao(publicas, mapa);
};

export const publicarStoryPerfil = async (
  uid: string,
  body: unknown,
): Promise<{ok: true; story: StoryPublica} | Falha> => {
  const foto = validarFotoStory(fotoDoBody(body), `stories/perfil/${uid}`);
  if (!foto.ok) {
    return {ok: false, status: 400, erro: ERRO_FOTO};
  }
  const desde = new Date(Date.now() - JANELA_MS);
  const recentes = (await storyLocalRepository.listarPorUsuario(uid, 50))
    .filter((story) =>
      story.album === "perfil" && Date.parse(story.createdAt) > desde.getTime(),
    );
  if (recentes.length >= TETO_FOTOS) {
    return {ok: false, status: 429, erro: ERRO_TETO_PERFIL};
  }
  const fotoUrl = (fotoDoBody(body) as string).trim();
  const criada = await storyLocalRepository.criar({
    usuarioId: uid,
    album: "perfil",
    localId: null,
    eventoId: null,
    fotoUrl,
    storagePath: foto.storagePath,
    marcaX: null,
    marcaY: null,
  });
  const usuario = await usuarioRepository.buscarPorId(uid);
  return {ok: true, story: paraPublica(criada, usuario)};
};

const ativasDoUsuario = async (uid: string): Promise<StoryLocal[]> => {
  const stories = await storyLocalRepository.listarPorUsuario(uid, 50);
  return porCriacao(stories.filter((story) => !expirada(story)));
};

export const contarStoriesUsuario = async (uid: string): Promise<number> =>
  (await ativasDoUsuario(uid)).length;

export const listarStoriesUsuario = async (
  uid: string,
): Promise<{stories: StoryPublica[]; storiesAtivas: number}> => {
  const proprias = await ativasDoUsuario(uid);
  const vistas = new Set(proprias.map((story) => story.id));
  const extras: StoryLocal[] = [];
  const albuns = new Map<string, {album: "local" | "evento"; id: string}>();
  for (const story of proprias) {
    if (story.album === "local" && story.localId) {
      albuns.set(`local:${story.localId}`, {album: "local", id: story.localId});
    } else if (story.album === "evento" && story.eventoId) {
      albuns.set(`evento:${story.eventoId}`, {album: "evento", id: story.eventoId});
    }
  }
  for (const alvo of albuns.values()) {
    const lista = alvo.album === "local" ?
      await storyLocalRepository.listarAtivasLocal(alvo.id, new Date(), TETO_LISTA) :
      await storyLocalRepository.listarAtivasEvento(alvo.id, new Date(), TETO_LISTA);
    for (const story of lista) {
      if (story.usuarioId === uid || vistas.has(story.id)) {
        continue;
      }
      vistas.add(story.id);
      extras.push(story);
    }
  }
  return {
    stories: await publicarLista(porCriacao([...proprias, ...extras])),
    storiesAtivas: proprias.length,
  };
};

export const apagarStoryPerfil = async (
  uid: string,
  storyId: string,
): Promise<{ok: true} | Falha> =>
  apagarSe(uid, storyId, (story) =>
    story.album === "perfil" && story.usuarioId === uid,
  );

export const marcarVistoPerfil = async (
  uid: string,
  autorUid: string,
  storyId: string,
): Promise<{ok: true} | Falha> => {
  const story = await storyLocalRepository.buscarPorId(storyId);
  if (!story || story.album !== "perfil" || story.usuarioId !== autorUid || expirada(story)) {
    return {ok: false, status: 404, erro: ERRO_STORY};
  }
  await storyLocalRepository.registrarVisto({
    id: `${uid}_perfil_${autorUid}`,
    usuarioId: uid,
    album: "perfil",
    localId: null,
    eventoId: null,
    vistoAte: story.createdAt,
  });
  return {ok: true};
};

const unirDestinatarios = (
  favoritos: string[],
  inscritos: string[],
  autorUid: string,
): string[] => {
  const uids: string[] = [];
  const vistos = new Set<string>();
  const incluir = (id: string) => {
    if (!id || id === autorUid || vistos.has(id) || uids.length >= TETO_PUSH) {
      return;
    }
    vistos.add(id);
    uids.push(id);
  };
  favoritos.forEach(incluir);
  inscritos.forEach(incluir);
  return uids;
};

const dispararPushLocal = async (
  local: Local,
  autorUid: string,
  apelido: string,
): Promise<void> => {
  const vestindo = await eventoQueVeste(local.id);
  if (vestindo) {
    await dispararPushEvento(vestindo, autorUid, apelido, local);
    return;
  }
  const reservou = await localRepository.reservarPushDoDia(
    local.id,
    ymdSaoPaulo(new Date()),
  );
  if (!reservou) {
    return;
  }
  const favoritos = await usuarioLocalFavoritoRepository
    .listarUsuarioIdsPorLocal(local.id, TETO_PUSH);
  const nome = cortar(local.nome);
  await notificarStory(
    unirDestinatarios(favoritos, [], autorUid),
    `${nome} está ao vivo`,
    `${apelido} postou uma foto`,
    `/locais/${local.id}?stories=1`,
    {localId: local.id, eventoId: ""},
  );
};

const urlStoryEvento = (evento: Evento): string =>
  evento.localId ?
    `/locais/${evento.localId}?stories=1` :
    `/eventos/${evento.id}?stories=1`;

const dispararPushEvento = async (
  evento: Evento,
  autorUid: string,
  apelido: string,
  localConhecido?: Local,
): Promise<void> => {
  const reservou = await eventoRepository.reservarPushDoDia(
    evento.id,
    ymdSaoPaulo(new Date()),
  );
  if (!reservou) {
    return;
  }
  const uids = (await dispositivoRepository.listarUids())
    .filter((id) => id !== autorUid);
  const titulo = cortar(evento.titulo);
  const local = localConhecido ?? (
    evento.localId ? await localRepository.buscarPorId(evento.localId) : null
  );
  const body = local ?
    `${apelido} postou uma foto no ${cortar(local.nome)}` :
    `${apelido} postou uma foto`;
  await notificarStory(
    uids,
    `O ${titulo} está rolando`,
    body,
    urlStoryEvento(evento),
    {localId: evento.localId ?? "", eventoId: evento.id},
    LOTE_AVISO_EVENTO,
  );
};

const comPush = async (
  story: StoryLocal,
  uid: string,
  enviar: (apelido: string) => Promise<void>,
): Promise<StoryPublica> => {
  const usuario = await usuarioRepository.buscarPorId(uid);
  try {
    await enviar(apelidoExibicao(usuario));
  } catch (error) {
    log.warn("Story", "Push não enviado", {storyId: story.id, ...erroDe(error)});
  }
  return paraPublica(story, usuario);
};

const gravarLocal = async (
  uid: string,
  local: Local,
  eventoId: string | null,
  fotoUrl: string,
  storagePath: string,
  posicao: {marcaX: number; marcaY: number} | null,
): Promise<StoryPublica> => {
  const criada = await storyLocalRepository.criar({
    usuarioId: uid,
    album: "local",
    localId: local.id,
    eventoId,
    fotoUrl,
    storagePath,
    marcaX: posicao?.marcaX ?? null,
    marcaY: posicao?.marcaY ?? null,
  });
  return comPush(criada, uid, (apelido) => dispararPushLocal(local, uid, apelido));
};

export const publicarStoryLocal = async (
  uid: string,
  local: Local,
  body: unknown,
): Promise<{ok: true; story: StoryPublica} | Falha> => {
  const gps = validarBodyCheckin(body);
  if (!gps.ok) {
    return {ok: false, status: 400, erro: gps.erro};
  }
  const foto = validarFotoStory(
    fotoDoBody(body),
    `stories/locais/${local.id}/${uid}`,
  );
  if (!foto.ok) {
    return {ok: false, status: 400, erro: ERRO_FOTO};
  }
  if (foraDoRaio(gps.dados.lat, gps.dados.lng, [local])) {
    return {ok: false, status: 400, erro: ERRO_RAIO};
  }
  const desde = new Date(Date.now() - JANELA_MS);
  const recentes = await storyLocalRepository.contarRecentesLocal(
    uid,
    local.id,
    desde,
  );
  if (recentes >= TETO_FOTOS) {
    return {ok: false, status: 429, erro: ERRO_TETO_PONTO};
  }
  const vestindo = await eventoQueVeste(local.id);
  const fotoUrl = (fotoDoBody(body) as string).trim();
  const story = await gravarLocal(
    uid,
    local,
    vestindo?.id ?? null,
    fotoUrl,
    foto.storagePath,
    posicaoDoBody(body),
  );
  return {ok: true, story};
};

export const publicarStoryEvento = async (
  uid: string,
  evento: Evento,
  body: unknown,
): Promise<{ok: true; story: StoryPublica} | Falha> => {
  if (!eventoEstaAoVivo(evento)) {
    return {ok: false, status: 400, erro: ERRO_JANELA};
  }
  const gps = validarBodyCheckin(body);
  if (!gps.ok) {
    return {ok: false, status: 400, erro: gps.erro};
  }

  if (evento.localId) {
    const local = await localRepository.buscarPorId(evento.localId);
    if (!local) {
      return {ok: false, status: 400, erro: "local não encontrado"};
    }
    const foto = validarFotoStory(
      fotoDoBody(body),
      `stories/locais/${local.id}/${uid}`,
    );
    if (!foto.ok) {
      return {ok: false, status: 400, erro: ERRO_FOTO};
    }
    const pins = [evento.local, {lat: local.lat, lng: local.lng}];
    if (foraDoRaio(gps.dados.lat, gps.dados.lng, pins)) {
      return {ok: false, status: 400, erro: ERRO_RAIO};
    }
    const desde = new Date(Date.now() - JANELA_MS);
    const recentes = await storyLocalRepository.contarRecentesLocal(
      uid,
      local.id,
      desde,
    );
    if (recentes >= TETO_FOTOS) {
      return {ok: false, status: 429, erro: ERRO_TETO_PONTO};
    }
    const fotoUrl = (fotoDoBody(body) as string).trim();
    const story = await gravarLocal(
      uid,
      local,
      evento.id,
      fotoUrl,
      foto.storagePath,
      posicaoDoBody(body),
    );
    return {ok: true, story};
  }

  const foto = validarFotoStory(
    fotoDoBody(body),
    `stories/eventos/${evento.id}/${uid}`,
  );
  if (!foto.ok) {
    return {ok: false, status: 400, erro: ERRO_FOTO};
  }
  if (foraDoRaio(gps.dados.lat, gps.dados.lng, [evento.local])) {
    return {ok: false, status: 400, erro: ERRO_RAIO};
  }
  const desde = new Date(Date.now() - JANELA_MS);
  const recentes = await storyLocalRepository.contarRecentesEvento(
    uid,
    evento.id,
    desde,
  );
  if (recentes >= TETO_FOTOS) {
    return {ok: false, status: 429, erro: ERRO_TETO_ENCONTRO};
  }
  const fotoUrl = (fotoDoBody(body) as string).trim();
  const posicao = posicaoDoBody(body);
  const criada = await storyLocalRepository.criar({
    usuarioId: uid,
    album: "evento",
    localId: null,
    eventoId: evento.id,
    fotoUrl,
    storagePath: foto.storagePath,
    marcaX: posicao?.marcaX ?? null,
    marcaY: posicao?.marcaY ?? null,
  });
  const story = await comPush(
    criada,
    uid,
    (apelido) => dispararPushEvento(evento, uid, apelido),
  );
  return {ok: true, story};
};

export const listarStoriesLocal = async (
  localId: string,
): Promise<ListaStories> => {
  const stories = await storyLocalRepository.listarAtivasLocal(
    localId,
    new Date(),
    TETO_LISTA,
  );
  const vestindo = await eventoQueVeste(localId);
  return {
    album: "local",
    localId,
    eventoId: vestindo?.id ?? null,
    eventoAoVivo: resumo(vestindo),
    stories: await publicarLista(stories),
  };
};

export const listarStoriesEvento = async (
  evento: Evento,
): Promise<ListaStories> => {
  if (evento.localId) {
    return listarStoriesLocal(evento.localId);
  }
  const stories = await storyLocalRepository.listarAtivasEvento(
    evento.id,
    new Date(),
    TETO_LISTA,
  );
  return {
    album: "evento",
    localId: null,
    eventoId: evento.id,
    eventoAoVivo: eventoEstaAoVivo(evento) ? resumo(evento) : null,
    stories: await publicarLista(stories),
  };
};

export const apagarStoryLocal = async (
  uid: string,
  localId: string,
  storyId: string,
): Promise<{ok: true} | Falha> =>
  apagarSe(uid, storyId, (story) =>
    story.album === "local" && story.localId === localId,
  );

export const apagarStoryEvento = async (
  uid: string,
  evento: Evento,
  storyId: string,
): Promise<{ok: true} | Falha> =>
  apagarSe(uid, storyId, (story) => {
    if (evento.localId) {
      return story.album === "local" && story.localId === evento.localId;
    }
    return story.album === "evento" && story.eventoId === evento.id;
  });

const apagarSe = async (
  uid: string,
  storyId: string,
  pertence: (story: StoryLocal) => boolean,
): Promise<{ok: true} | Falha> => {
  const story = await storyLocalRepository.buscarPorId(storyId);
  if (!story || !pertence(story) || expirada(story)) {
    return {ok: false, status: 404, erro: ERRO_STORY};
  }
  if (story.usuarioId !== uid) {
    return {ok: false, status: 403, erro: ERRO_AUTOR};
  }
  await apagarObjetoStory(story.storagePath);
  await storyLocalRepository.remover(story.id);
  return {ok: true};
};

export const marcarVistoLocal = async (
  uid: string,
  localId: string,
  storyId: string,
): Promise<{ok: true} | Falha> =>
  marcarVisto(uid, storyId, "local", localId);

export const marcarVistoEvento = async (
  uid: string,
  evento: Evento,
  storyId: string,
): Promise<{ok: true} | Falha> => {
  if (evento.localId) {
    return marcarVisto(uid, storyId, "local", evento.localId);
  }
  return marcarVisto(uid, storyId, "evento", evento.id);
};

const marcarVisto = async (
  uid: string,
  storyId: string,
  album: AlbumStory,
  alvoId: string,
): Promise<{ok: true} | Falha> => {
  const story = await storyLocalRepository.buscarPorId(storyId);
  if (!story || expirada(story)) {
    return {ok: false, status: 404, erro: ERRO_STORY};
  }
  const doAlbum = album === "local" ?
    story.album === "local" && story.localId === alvoId :
    story.album === "evento" && story.eventoId === alvoId;
  if (!doAlbum) {
    return {ok: false, status: 404, erro: ERRO_STORY};
  }
  await storyLocalRepository.registrarVisto({
    id: album === "local" ?
      idVistoLocal(uid, alvoId) :
      idVistoEvento(uid, alvoId),
    usuarioId: uid,
    album,
    localId: album === "local" ? alvoId : null,
    eventoId: album === "evento" ? alvoId : null,
    vistoAte: story.createdAt,
  });
  return {ok: true};
};

export const detalheStoriesLocal = async (localId: string): Promise<{
  storiesAtivas: number;
  eventoAoVivo: EventoAoVivoResumo | null;
}> => {
  const [storiesAtivas, vestindo] = await Promise.all([
    storyLocalRepository.contarAtivasLocal(localId, new Date()),
    eventoQueVeste(localId),
  ]);
  return {storiesAtivas, eventoAoVivo: resumo(vestindo)};
};

export const detalheStoriesEvento = async (evento: Evento): Promise<{
  storiesAtivas: number;
  podePostarStory: boolean;
}> => {
  const storiesAtivas = evento.localId ?
    await storyLocalRepository.contarAtivasLocal(evento.localId, new Date()) :
    await storyLocalRepository.contarAtivasEvento(evento.id, new Date());
  return {storiesAtivas, podePostarStory: eventoEstaAoVivo(evento)};
};

export const aoVivoPorEvento = async (
  eventos: Array<{id: string; localId: string | null}>,
): Promise<Map<string, boolean>> => {
  const chaves = new Map<string, {album: AlbumStory; id: string}>();
  for (const evento of eventos) {
    if (evento.localId) {
      chaves.set(`local:${evento.localId}`, {
        album: "local",
        id: evento.localId,
      });
    } else {
      chaves.set(`evento:${evento.id}`, {album: "evento", id: evento.id});
    }
  }
  const entradas = [...chaves.entries()];
  const contagens = new Map<string, number>();
  const agora = new Date();
  for (let i = 0; i < entradas.length; i += 8) {
    const lote = entradas.slice(i, i + 8);
    const pares = await Promise.all(lote.map(async ([chave, alvo]) => {
      const total = alvo.album === "local" ?
        await storyLocalRepository.contarAtivasLocal(alvo.id, agora) :
        await storyLocalRepository.contarAtivasEvento(alvo.id, agora);
      return [chave, total] as const;
    }));
    for (const [chave, total] of pares) {
      contagens.set(chave, total);
    }
  }
  const mapa = new Map<string, boolean>();
  for (const evento of eventos) {
    const chave = evento.localId ?
      `local:${evento.localId}` :
      `evento:${evento.id}`;
    mapa.set(evento.id, (contagens.get(chave) ?? 0) > 0);
  }
  return mapa;
};

const temNaoVisto = (
  stories: StoryLocal[],
  uid: string,
  vistoAte: string | null,
): boolean => {
  const limite = vistoAte ? Date.parse(vistoAte) : Number.NEGATIVE_INFINITY;
  return stories.some((story) =>
    story.usuarioId !== uid && Date.parse(story.createdAt) > limite,
  );
};

const anelDoLocal = async (
  local: Local,
  uid: string,
  vistos: Map<string, StoryVisto>,
): Promise<AnelInterno | null> => {
  const agora = new Date();
  const stories = await storyLocalRepository.listarAtivasLocal(
    local.id,
    agora,
    TETO_LISTA,
  );
  if (stories.length === 0) {
    return null;
  }
  const contagem = stories.length < TETO_LISTA ?
    stories.length :
    await storyLocalRepository.contarAtivasLocal(local.id, agora);
  const vestindo = await eventoQueVeste(local.id);
  const ultima = stories[stories.length - 1];
  const visto = vistos.get(idVistoLocal(uid, local.id));
  return {
    album: "local",
    localId: local.id,
    eventoId: vestindo?.id ?? null,
    nome: local.nome,
    fotoUrl: ultima.fotoUrl,
    contagem,
    naoVisto: temNaoVisto(stories, uid, visto?.vistoAte ?? null),
    eventoAoVivo: resumo(vestindo),
    recenteEm: ultima.createdAt,
  };
};

const ordenarAneis = (aneis: AnelInterno[]): AnelStory[] =>
  [...aneis]
    .sort((a, b) => {
      if (a.naoVisto !== b.naoVisto) {
        return a.naoVisto ? -1 : 1;
      }
      const vivoA = a.eventoAoVivo ? 1 : 0;
      const vivoB = b.eventoAoVivo ? 1 : 0;
      if (vivoA !== vivoB) {
        return vivoB - vivoA;
      }
      return b.recenteEm.localeCompare(a.recenteEm);
    })
    .map((anel) => ({
      album: anel.album,
      localId: anel.localId,
      eventoId: anel.eventoId,
      nome: anel.nome,
      fotoUrl: anel.fotoUrl,
      contagem: anel.contagem,
      naoVisto: anel.naoVisto,
      eventoAoVivo: anel.eventoAoVivo,
    }));

const emLotes = async <T, R>(
  itens: T[],
  tamanho: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> => {
  const saida: R[] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    const parcial = await Promise.all(itens.slice(i, i + tamanho).map(fn));
    saida.push(...parcial);
  }
  return saida;
};

const candidatosLocais = async (
  uid: string,
  geo: GeoAneis | null,
): Promise<Local[]> => {
  if (!geo) {
    const ids = await usuarioLocalFavoritoRepository.listarLocalIdsPorUsuario(uid);
    return localRepository.buscarPorIds(ids);
  }
  if (geo.raioKm === undefined) {
    const recentes = await storyLocalRepository.listarRecentesNaoExpiradas(
      new Date(),
      LOTE_RECENTES,
    );
    const ids: string[] = [];
    const ja = new Set<string>();
    for (const story of recentes) {
      if (story.album !== "local" || !story.localId || ja.has(story.localId)) {
        continue;
      }
      ja.add(story.localId);
      ids.push(story.localId);
      if (ids.length >= TETO_ANEIS) {
        break;
      }
    }
    const locais = await localRepository.buscarPorIds(ids);
    const porId = new Map(locais.map((local) => [local.id, local]));
    return ids.flatMap((id) => {
      const local = porId.get(id);
      return local ? [local] : [];
    });
  }
  const todos = await localRepository.listar();
  return filtrarLocaisFeed(todos, {
    lat: geo.lat,
    lng: geo.lng,
    raioKm: geo.raioKm,
  });
};

const aneisLocais = async (
  uid: string,
  geo: GeoAneis | null,
): Promise<AnelStory[]> => {
  const locais = await candidatosLocais(uid, geo);
  if (locais.length === 0) {
    return [];
  }
  const vistos = await storyLocalRepository.buscarVistos(
    locais.map((local) => idVistoLocal(uid, local.id)),
  );
  const porId = new Map(vistos.map((visto) => [visto.id, visto]));
  const aneis = await emLotes(locais, 6, (local) =>
    anelDoLocal(local, uid, porId),
  );
  return cortarAneis(
    ordenarAneis(aneis.filter((anel): anel is AnelInterno => anel !== null)),
    geo,
  );
};

const cortarAneis = (aneis: AnelStory[], geo: GeoAneis | null): AnelStory[] =>
  geo?.raioKm !== undefined ? aneis : aneis.slice(0, TETO_ANEIS);

const candidatosEventos = async (
  uid: string,
  geo: GeoAneis | null,
): Promise<Evento[]> => {
  if (!geo) {
    const inscricoes = await usuarioEventoRepository.listarPorUsuario(uid);
    const eventos = await eventoRepository.buscarPorIds(
      inscricoes.map((item) => item.eventoId),
    );
    return eventos.filter((evento) => eventoEstaAoVivo(evento));
  }
  const aoVivo = (await eventoRepository.listarFuturos())
    .filter((evento) => eventoEstaAoVivo(evento));
  if (geo.raioKm === undefined) {
    return [...aoVivo]
      .sort((a, b) => b.dataHoraAbertura.localeCompare(a.dataHoraAbertura))
      .slice(0, TETO_ANEIS);
  }
  return filtrarEventosFeed(aoVivo, {
    lat: geo.lat,
    lng: geo.lng,
    raioKm: geo.raioKm,
  });
};

const anelDoEvento = async (
  evento: Evento,
  uid: string,
  vistos: Map<string, StoryVisto>,
): Promise<AnelInterno | null> => {
  if (evento.localId) {
    const local = await localRepository.buscarPorId(evento.localId);
    if (!local) {
      return null;
    }
    const base = await anelDoLocal(local, uid, vistos);
    if (!base) {
      return null;
    }
    return {
      ...base,
      eventoId: evento.id,
      nome: evento.titulo,
      eventoAoVivo: {id: evento.id, titulo: evento.titulo},
    };
  }
  const agora = new Date();
  const stories = await storyLocalRepository.listarAtivasEvento(
    evento.id,
    agora,
    TETO_LISTA,
  );
  if (stories.length === 0) {
    return null;
  }
  const contagem = stories.length < TETO_LISTA ?
    stories.length :
    await storyLocalRepository.contarAtivasEvento(evento.id, agora);
  const ultima = stories[stories.length - 1];
  const visto = vistos.get(idVistoEvento(uid, evento.id));
  return {
    album: "evento",
    localId: null,
    eventoId: evento.id,
    nome: evento.titulo,
    fotoUrl: ultima.fotoUrl,
    contagem,
    naoVisto: temNaoVisto(stories, uid, visto?.vistoAte ?? null),
    eventoAoVivo: {id: evento.id, titulo: evento.titulo},
    recenteEm: ultima.createdAt,
  };
};

const aneisEventos = async (
  uid: string,
  geo: GeoAneis | null,
): Promise<AnelStory[]> => {
  const eventos = await candidatosEventos(uid, geo);
  if (eventos.length === 0) {
    return [];
  }
  const vistos = await storyLocalRepository.buscarVistos(eventos.map((evento) =>
    evento.localId ?
      idVistoLocal(uid, evento.localId) :
      idVistoEvento(uid, evento.id),
  ));
  const porId = new Map(vistos.map((visto) => [visto.id, visto]));
  const aneis = await emLotes(eventos, 6, (evento) =>
    anelDoEvento(evento, uid, porId),
  );
  return cortarAneis(
    ordenarAneis(aneis.filter((anel): anel is AnelInterno => anel !== null)),
    geo,
  );
};

export const listarAneisAoVivo = async (
  uid: string,
  aba: "locais" | "eventos",
  geo: GeoAneis | null,
): Promise<AnelStory[]> =>
  aba === "locais" ? aneisLocais(uid, geo) : aneisEventos(uid, geo);

export const expirarStoriesLote = async (): Promise<number> => {
  const stories = await storyLocalRepository.listarExpiradas(new Date(), 200);
  let apagados = 0;
  for (const story of stories) {
    await apagarObjetoStory(story.storagePath);
    await storyLocalRepository.remover(story.id);
    apagados += 1;
  }
  return apagados;
};

export const apagarStoriesDoUsuario = async (uid: string): Promise<void> => {
  const agora = Date.now();
  const stories = await storyLocalRepository.listarPorUsuario(uid, 200);
  for (const story of stories) {
    if (Date.parse(story.expiresAt) <= agora) {
      continue;
    }
    await apagarObjetoStory(story.storagePath);
    await storyLocalRepository.remover(story.id);
  }
};
