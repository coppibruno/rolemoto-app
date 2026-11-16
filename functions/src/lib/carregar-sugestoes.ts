import {erroDe, log} from "./log";
import {apelidoExibicao} from "./apelido";
import {haversineKm} from "./geo";
import {ymdSaoPaulo} from "./quando";
import {
  MS_DIA,
  RAIO_SUGESTAO_KM,
  montarSugestoes,
  pontoDaFoto,
  pontoDaStory,
} from "./sugestao-piloto";
import type {PerfilDesempate, RastoBruto} from "./sugestao-piloto";
import {
  seguirRepository,
  sugestaoRepository,
  usuarioRepository,
} from "../repositories";
import type {
  FotoJanela,
  PontoEvento,
  RoleJanela,
  StoryJanela,
  TelemetriaJanela,
} from "../repositories/interfaces/sugestao.repository";
import type {LinhaSugestao} from "../types/seguir";

const TETO_INTERMEDIARIOS = 10;
const TETO_SEGUIDOS = 10;
const TETO_CATALOGO = 40;

type Coordenada = {lat: number; lng: number};

const lerFaixa = async <T>(
  nome: string,
  fn: () => Promise<T>,
  vazio: T,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    log.warn("Sugestoes", "Falha ao ler rasto", {nome, ...erroDe(error)});
    return vazio;
  }
};

const kmAte = (origem: Coordenada, lat: number, lng: number): number =>
  Math.round(haversineKm(origem.lat, origem.lng, lat, lng));

const rastrosSeguidores = async (uid: string): Promise<RastoBruto[]> => {
  const pagina = await seguirRepository.listarSeguidores(uid, null);
  if (!pagina.ok) {
    return [];
  }
  return pagina.vinculos.map((vinculo) => ({
    uid: vinculo.seguidorId,
    tipo: "segue_voce" as const,
    distanciaKm: null,
  }));
};

const rastrosSegundoGrau = async (uid: string): Promise<RastoBruto[]> => {
  const euSigo = await seguirRepository.listarSeguidosRecentes(
    uid,
    TETO_INTERMEDIARIOS,
  );
  const perfis = await usuarioRepository.buscarPorIds(euSigo);
  const porId = new Map(perfis.map((pessoa) => [pessoa.uid, pessoa]));
  const rastros: RastoBruto[] = [];
  for (let indice = 0; indice < euSigo.length; indice += 1) {
    const intermediario = euSigo[indice];
    if (!intermediario) {
      continue;
    }
    const seguidos = await seguirRepository.listarSeguidosRecentes(
      intermediario,
      TETO_SEGUIDOS,
    );
    const recencia = euSigo.length - indice;
    const apelido = apelidoExibicao(porId.get(intermediario) ?? null);
    for (const alvo of seguidos) {
      rastros.push({
        uid: alvo,
        tipo: "seguido_por",
        distanciaKm: null,
        apelidoIntermediario: apelido,
        recencia,
      });
    }
  }
  return rastros;
};

const rastrosRoles = (roles: RoleJanela[], origem: Coordenada): RastoBruto[] => {
  const vistos = new Set<string>();
  const rastros: RastoBruto[] = [];
  for (const role of roles) {
    if (!role.criadorId || vistos.has(role.criadorId)) {
      continue;
    }
    const distanciaKm = kmAte(origem, role.lat, role.lng);
    if (distanciaKm > RAIO_SUGESTAO_KM) {
      continue;
    }
    vistos.add(role.criadorId);
    rastros.push({
      uid: role.criadorId,
      tipo: "organizou_role",
      distanciaKm,
      titulo: role.titulo,
    });
  }
  return rastros;
};

const rastrosTelemetria = (
  itens: TelemetriaJanela[],
  origem: Coordenada,
): RastoBruto[] => {
  const vistos = new Set<string>();
  const rastros: RastoBruto[] = [];
  for (const item of itens) {
    if (!item.publica || !item.usuarioId || vistos.has(item.usuarioId)) {
      continue;
    }
    const distanciaKm = kmAte(origem, item.lat, item.lng);
    if (distanciaKm > RAIO_SUGESTAO_KM) {
      continue;
    }
    vistos.add(item.usuarioId);
    rastros.push({
      uid: item.usuarioId,
      tipo: "telemetria",
      distanciaKm,
      nome: item.nome,
    });
  }
  return rastros;
};

const guardarId = (ids: string[], id: string | null) => {
  if (!id || ids.includes(id) || ids.length >= TETO_CATALOGO) {
    return;
  }
  ids.push(id);
};

const rastrosPublicou = async (
  stories: StoryJanela[],
  fotos: FotoJanela[],
  origem: Coordenada,
): Promise<RastoBruto[]> => {
  try {
    type Pub =
      | {createdAt: string; story: StoryJanela; foto?: undefined}
      | {createdAt: string; foto: FotoJanela; story?: undefined};
    const pubs: Pub[] = [
      ...stories.map((story) => ({createdAt: story.createdAt, story})),
      ...fotos.map((foto) => ({createdAt: foto.createdAt, foto})),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const eventosIds: string[] = [];
    for (const pub of pubs) {
      if (pub.story?.album === "evento") {
        guardarId(eventosIds, pub.story.eventoId);
      }
      if (pub.foto?.marcaTipo === "evento") {
        guardarId(eventosIds, pub.foto.marcaId);
      }
    }
    const eventos = await sugestaoRepository.listarEventos(eventosIds);
    const mapaEventos = new Map<string, PontoEvento>(
      eventos.map((evento) => [evento.id, evento]),
    );

    const locaisIds: string[] = [];
    for (const pub of pubs) {
      if (pub.story?.album === "local") {
        guardarId(locaisIds, pub.story.localId);
      }
      if (pub.foto?.marcaTipo === "local") {
        guardarId(locaisIds, pub.foto.marcaId);
      }
      const eventoId = pub.story?.album === "evento" ?
        pub.story.eventoId :
        pub.foto?.marcaTipo === "evento" ? pub.foto.marcaId : null;
      const evento = eventoId ? mapaEventos.get(eventoId) : undefined;
      if (evento?.localId) {
        guardarId(locaisIds, evento.localId);
      }
    }
    const locais = await sugestaoRepository.listarLocais(locaisIds);
    const mapaLocais = new Map(locais.map((local) => [local.id, local]));
    const mapaEventoPonto = new Map(
      eventos.map((evento) => [evento.id, {
        localId: evento.localId,
        nome: evento.nome,
        lat: evento.lat,
        lng: evento.lng,
      }]),
    );

    const vistos = new Set<string>();
    const rastros: RastoBruto[] = [];
    for (const pub of pubs) {
      const uid = pub.story?.usuarioId ?? pub.foto?.usuarioId ?? "";
      if (!uid || vistos.has(uid)) {
        continue;
      }
      const ponto = pub.story ?
        pontoDaStory(pub.story, mapaLocais, mapaEventoPonto) :
        pub.foto ?
          pontoDaFoto(pub.foto, mapaLocais, mapaEventoPonto) :
          null;
      if (!ponto) {
        continue;
      }
      const distanciaKm = kmAte(origem, ponto.lat, ponto.lng);
      if (distanciaKm > RAIO_SUGESTAO_KM) {
        continue;
      }
      vistos.add(uid);
      rastros.push({
        uid,
        tipo: "publicou",
        distanciaKm,
        nome: ponto.nome,
        recencia: Date.parse(pub.createdAt) || 0,
      });
    }
    return rastros;
  } catch (error) {
    log.warn("Sugestoes", "Falha ao ler rasto", {
      nome: "publicou",
      ...erroDe(error),
    });
    return [];
  }
};

export const carregarSugestoes = async (
  uid: string,
  coords: Coordenada | null,
): Promise<LinhaSugestao[]> => {
  const agora = new Date();
  const desde30 = new Date(agora.getTime() - 30 * MS_DIA);
  const fim30 = new Date(agora.getTime() + 30 * MS_DIA);
  const desde14 = new Date(agora.getTime() - 14 * MS_DIA);

  const [euDoc, dispensados, seguidores, segundoGrau] = await Promise.all([
    lerFaixa("perfil", () => usuarioRepository.buscarPorId(uid), null),
    lerFaixa(
      "dispensa",
      () => sugestaoRepository.listarDispensadosVigentes(uid, agora),
      [] as string[],
    ),
    lerFaixa("segue_voce", () => rastrosSeguidores(uid), [] as RastoBruto[]),
    lerFaixa("seguido_por", () => rastrosSegundoGrau(uid), [] as RastoBruto[]),
  ]);

  let geo: RastoBruto[] = [];
  if (coords) {
    const [roles, teles, stories, fotos] = await Promise.all([
      lerFaixa(
        "organizou_role",
        () => sugestaoRepository.listarRolesJanela(agora, fim30),
        [] as RoleJanela[],
      ),
      lerFaixa(
        "telemetria",
        () => sugestaoRepository.listarTelemetriasRecentes(desde30),
        [] as TelemetriaJanela[],
      ),
      lerFaixa(
        "stories",
        () => sugestaoRepository.listarStoriesVivas(agora),
        [] as StoryJanela[],
      ),
      lerFaixa(
        "fotos",
        () => sugestaoRepository.listarFotosRecentes(desde14),
        [] as FotoJanela[],
      ),
    ]);
    geo = [
      ...rastrosRoles(roles, coords),
      ...rastrosTelemetria(teles, coords),
      ...await rastrosPublicou(stories, fotos, coords),
    ];
  }

  const dispensadoSet = new Set(dispensados);
  const uids = [...new Set([...seguidores, ...segundoGrau, ...geo].map((r) => r.uid))]
    .filter((id) => id && id !== uid && !dispensadoSet.has(id));

  const [perfis, vinculos] = await Promise.all([
    uids.length > 0 ? usuarioRepository.buscarPorIds(uids) : [],
    uids.length > 0 ? seguirRepository.vinculosCom(uid, uids) : new Map(),
  ]);
  const seguidos = new Set(
    [...vinculos.entries()]
      .filter(([, vinculo]) => vinculo.seguidoPorMim)
      .map(([id]) => id),
  );
  const mapaPerfis = new Map<string, PerfilDesempate>(
    perfis.map((pessoa) => [pessoa.uid, {
      pilotagem: pessoa.pilotagem,
      tipoMoto: pessoa.tipoMoto,
      cidade: pessoa.cidade,
    }]),
  );
  const eu: PerfilDesempate = {
    pilotagem: euDoc?.pilotagem ?? null,
    tipoMoto: euDoc?.tipoMoto ?? null,
    cidade: euDoc?.cidade ?? "",
  };
  const ordenadas = montarSugestoes({
    rastros: [...seguidores, ...segundoGrau, ...geo],
    perfis: mapaPerfis,
    euUid: uid,
    eu,
    seguidos,
    dispensados: dispensadoSet,
    ymd: ymdSaoPaulo(agora),
  });

  const porUsuario = new Map(perfis.map((pessoa) => [pessoa.uid, pessoa]));
  const itens: LinhaSugestao[] = [];
  for (const item of ordenadas) {
    const pessoa = porUsuario.get(item.uid);
    if (!pessoa) {
      continue;
    }
    itens.push({
      uid: pessoa.uid,
      nome: pessoa.nome,
      apelido: apelidoExibicao(pessoa),
      fotoUrl: pessoa.fotoUrl,
      cidade: pessoa.cidade,
      seguidoPorMim: false,
      segueVoce: vinculos.get(item.uid)?.segueVoce ?? false,
      motivo: {tipo: item.tipo, texto: item.texto},
    });
  }
  return itens;
};
