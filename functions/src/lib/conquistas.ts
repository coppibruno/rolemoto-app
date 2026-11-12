import {erroDe, log} from "./log";
import {avaliarPassagens} from "./passagem-conquista";
import {cortarRoda, montarRanking} from "./ranking-conquista";
import {decodificarPolyline} from "./tracado";
import {
  conquistaRepository,
  roleTelemetriaRepository,
  seguirRepository,
  usuarioRepository,
} from "../repositories";
import {TETO_RODA_RANKING} from "../types/conquista";
import type {
  AmostraConquista,
  ConquistaConcedida,
  ConquistaPerfil,
  ConquistaPublica,
  MedalhaPublica,
  MedalhaTelemetria,
  RankingConquista,
  ResultadoConcessao,
} from "../types/conquista";

export type PasseioParaConcessao = {
  usuarioId: string;
  telemetriaId: string;
  tracado: string;
  iniciadoEm: string;
  encerradoEm: string;
};

const MAX_MEDALHAS = 6;

const semConcessao = (): ResultadoConcessao => ({conquistas: [], medalhas: []});

/**
 * Concessão depois do `POST /telemetria` (SPEC 056 §6) e as medalhas do mapa
 * (SPEC 058 §4). Nunca lança: o passeio já está gravado e uma falha aqui
 * devolve listas vazias.
 */
export const concederConquistas = async (
  passeio: PasseioParaConcessao,
  amostras: AmostraConquista[],
): Promise<ResultadoConcessao> => {
  if (amostras.length === 0) return semConcessao();
  try {
    if (decodificarPolyline(passeio.tracado).length < 2) return semConcessao();
    const citadas = new Set(amostras.map((a) => a.conquistaId));
    const ativas = (await conquistaRepository.listar())
      .filter((c) => c.ativa && citadas.has(c.id));
    if (ativas.length === 0) return semConcessao();

    const passagens = avaliarPassagens({
      tracado: passeio.tracado,
      iniciadoEmMs: Date.parse(passeio.iniciadoEm),
      encerradoEmMs: Date.parse(passeio.encerradoEm),
      conquistas: ativas,
      amostras,
    });
    const porId = new Map(ativas.map((c) => [c.id, c]));
    const concedidas: ConquistaConcedida[] = [];
    const medalhas: MedalhaTelemetria[] = [];
    for (const passagem of passagens) {
      const conquista = porId.get(passagem.conquistaId);
      if (!conquista) continue;
      const novidade = await conquistaRepository.registrarPassagem({
        usuarioId: passeio.usuarioId,
        conquistaId: passagem.conquistaId,
        velocidadeMaxKmh: passagem.velocidadeMaxKmh,
        telemetriaId: passeio.telemetriaId,
      });
      if (medalhas.length < MAX_MEDALHAS) {
        medalhas.push({
          conquistaId: conquista.id,
          nome: conquista.nome,
          lat: conquista.lat,
          lng: conquista.lng,
          velocidadeMaxKmh: passagem.velocidadeMaxKmh,
          novidade: novidade ?? "passagem",
        });
      }
      if (!novidade) continue;
      concedidas.push({
        id: conquista.id,
        nome: conquista.nome,
        velocidadeMaxKmh: passagem.velocidadeMaxKmh,
        novidade,
      });
    }
    if (concedidas.length > 0) {
      log.info("Conquista", "Carimbos gravados", {
        uid: passeio.usuarioId,
        telemetriaId: passeio.telemetriaId,
        conquistas: concedidas.map((c) => `${c.id}:${c.novidade}`),
      });
    }
    return {conquistas: concedidas, medalhas};
  } catch (error) {
    log.error("Conquista", "Falha na concessão", {
      telemetriaId: passeio.telemetriaId,
      ...erroDe(error),
    });
    return semConcessao();
  }
};

/** Update das medalhas no doc já criado. Nunca lança: o 201 do passeio segue. */
export const gravarMedalhas = async (
  telemetriaId: string,
  medalhas: MedalhaTelemetria[],
): Promise<void> => {
  if (medalhas.length === 0) return;
  try {
    await roleTelemetriaRepository.atualizarMedalhas(telemetriaId, medalhas);
  } catch (error) {
    log.error("Medalha", "Falha ao gravar medalhas", {telemetriaId, ...erroDe(error)});
  }
};

/** O pino continua no mapa de quem vê o passeio; o número fica com o dono. */
export const medalhasParaLeitor = (
  medalhas: MedalhaTelemetria[],
  dono: boolean,
): (MedalhaTelemetria | MedalhaPublica)[] =>
  dono ?
    medalhas :
    medalhas.map((m) => ({
      conquistaId: m.conquistaId,
      nome: m.nome,
      lat: m.lat,
      lng: m.lng,
      novidade: m.novidade,
    }));

/** `null` quando o pino não existe no catálogo; arquivado responde. */
export const rankingDaConquista = async (
  tokenUid: string,
  conquistaId: string,
): Promise<RankingConquista | null> => {
  const conquista = await conquistaRepository.buscarPorId(conquistaId);
  if (!conquista) return null;
  const seguidos = await seguirRepository.listarSeguidosRecentes(
    tokenUid,
    TETO_RODA_RANKING,
  );
  const roda = cortarRoda(tokenUid, seguidos);
  const [carimbos, usuarios] = await Promise.all([
    conquistaRepository.buscarCarimbos(roda, conquista.id),
    usuarioRepository.buscarPorIds(roda),
  ]);
  return {
    conquista: {id: conquista.id, nome: conquista.nome},
    teto: TETO_RODA_RANKING,
    itens: montarRanking({tokenUid, carimbos, pessoas: usuarios}),
  };
};

/** Nome atual do catálogo; conquista sumida do catálogo sai da lista. */
export const conquistasDoPerfil = async (uid: string): Promise<ConquistaPerfil[]> => {
  const carimbos = await conquistaRepository.listarPorUsuario(uid);
  if (carimbos.length === 0) return [];
  const catalogo = new Map(
    (await conquistaRepository.listar()).map((c) => [c.id, c]),
  );
  return carimbos.flatMap((carimbo) => {
    const conquista = catalogo.get(carimbo.conquistaId);
    if (!conquista) return [];
    return [{
      id: conquista.id,
      nome: conquista.nome,
      velocidadeMaxKmh: carimbo.velocidadeMaxKmh,
    }];
  });
};

/** Mesma lista do perfil, sem a velocidade — vale também para o próprio uid. */
export const conquistasPublicas = async (uid: string): Promise<ConquistaPublica[]> =>
  (await conquistasDoPerfil(uid)).map(({id, nome}) => ({id, nome}));

/** Perfil não cai se a faixa falhar: segue com `[]`. */
export const semFalhar = async <T>(
  area: string,
  uid: string,
  carregar: () => Promise<T[]>,
): Promise<T[]> => {
  try {
    return await carregar();
  } catch (error) {
    log.warn(area, "Conquistas indisponíveis no perfil", {uid, ...erroDe(error)});
    return [];
  }
};
