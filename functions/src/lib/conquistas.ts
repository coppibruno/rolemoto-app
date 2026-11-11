import {erroDe, log} from "./log";
import {avaliarPassagens} from "./passagem-conquista";
import {decodificarPolyline} from "./tracado";
import {conquistaRepository} from "../repositories";
import type {
  AmostraConquista,
  ConquistaConcedida,
  ConquistaPerfil,
  ConquistaPublica,
} from "../types/conquista";

export type PasseioParaConcessao = {
  usuarioId: string;
  telemetriaId: string;
  tracado: string;
  iniciadoEm: string;
  encerradoEm: string;
};

/**
 * Concessão depois do `POST /telemetria` (SPEC 056 §6). Nunca lança:
 * o passeio já está gravado e uma falha aqui devolve `[]`.
 */
export const concederConquistas = async (
  passeio: PasseioParaConcessao,
  amostras: AmostraConquista[],
): Promise<ConquistaConcedida[]> => {
  if (amostras.length === 0) return [];
  try {
    if (decodificarPolyline(passeio.tracado).length < 2) return [];
    const citadas = new Set(amostras.map((a) => a.conquistaId));
    const ativas = (await conquistaRepository.listar())
      .filter((c) => c.ativa && citadas.has(c.id));
    if (ativas.length === 0) return [];

    const passagens = avaliarPassagens({
      tracado: passeio.tracado,
      iniciadoEmMs: Date.parse(passeio.iniciadoEm),
      encerradoEmMs: Date.parse(passeio.encerradoEm),
      conquistas: ativas,
      amostras,
    });
    const porId = new Map(ativas.map((c) => [c.id, c]));
    const concedidas: ConquistaConcedida[] = [];
    for (const passagem of passagens) {
      const novidade = await conquistaRepository.registrarPassagem({
        usuarioId: passeio.usuarioId,
        conquistaId: passagem.conquistaId,
        velocidadeMaxKmh: passagem.velocidadeMaxKmh,
        telemetriaId: passeio.telemetriaId,
      });
      const conquista = porId.get(passagem.conquistaId);
      if (!novidade || !conquista) continue;
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
    return concedidas;
  } catch (error) {
    log.error("Conquista", "Falha na concessão", {
      telemetriaId: passeio.telemetriaId,
      ...erroDe(error),
    });
    return [];
  }
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
