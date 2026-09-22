import {createHash, randomBytes, timingSafeEqual} from "crypto";
import {
  aplicarPonto,
  estadoCalculoInicial,
  type PontoGps,
} from "./calcular-metricas-telemetria";
import type {
  TelemetriaSessao,
  TelemetriaSessaoCriada,
} from "../types/telemetria-sessao";
import type {TelemetriaSessaoInterna} from
  "../repositories/interfaces/telemetria-sessao.repository";
import {telemetriaSessaoRepository} from "../repositories";

export const HEADER_SESSAO_TOKEN = "x-rolemoto-sessao-token";

const MAX_SESSAO_MS = 24 * 60 * 60 * 1000;

export const hashTokenSessao = (token: string): string =>
  createHash("sha256").update(token, "utf8").digest("hex");

export const tokensIguais = (a: string, b: string): boolean => {
  const ha = Buffer.from(hashTokenSessao(a), "hex");
  const hb = Buffer.from(b, "hex");
  if (ha.length !== hb.length) return false;
  return timingSafeEqual(ha, hb);
};

export const sessaoParaResposta = (
  doc: TelemetriaSessaoInterna,
): TelemetriaSessao => ({
  id: doc.id,
  usuarioId: doc.usuarioId,
  iniciadoEm: doc.iniciadoEm,
  distanciaKm: doc.distanciaKm,
  velocidadeMaxKmh: doc.velocidadeMaxKmh,
  tempoMovimentoSegundos: doc.tempoMovimentoSegundos,
  primeiro: doc.primeiro,
  ultimo: doc.ultimo,
  paradoDesde: doc.paradoDesde,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const criarTelemetriaSessao = async (
  usuarioId: string,
): Promise<TelemetriaSessaoCriada> => {
  await telemetriaSessaoRepository.excluirPorUsuario(usuarioId);
  const token = randomBytes(32).toString("hex");
  const iniciadoEm = new Date().toISOString();
  const sessao = await telemetriaSessaoRepository.criar({
    usuarioId,
    tokenHash: hashTokenSessao(token),
    iniciadoEm,
    ...estadoCalculoInicial(),
  });
  return {id: sessao.id, token, iniciadoEm};
};

export const parsePontoCapgo = (
  body: Record<string, unknown>,
): {ok: true; ponto: PontoGps} | {ok: false; erro: string} => {
  if (!Number.isFinite(body.latitude) || !Number.isFinite(body.longitude)) {
    return {ok: false, erro: "latitude/longitude inválidos"};
  }
  const lat = body.latitude as number;
  const lng = body.longitude as number;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {ok: false, erro: "coordenadas fora do intervalo"};
  }
  const time =
    typeof body.time === "number" && Number.isFinite(body.time) ?
      body.time :
      Date.now();
  const accuracy =
    typeof body.accuracy === "number" && Number.isFinite(body.accuracy) ?
      body.accuracy :
      null;
  const speed =
    typeof body.speed === "number" && Number.isFinite(body.speed) ?
      body.speed :
      null;
  return {
    ok: true,
    ponto: {lat, lng, t: time, speed, accuracy},
  };
};

export const sessaoExpirada = (iniciadoEmIso: string, agora = Date.now()): boolean => {
  const inicio = Date.parse(iniciadoEmIso);
  if (!Number.isFinite(inicio)) return true;
  return agora - inicio > MAX_SESSAO_MS;
};

export const ingerirPontoSessao = async (
  sessaoId: string,
  tokenPlain: string,
  body: Record<string, unknown>,
): Promise<"ok" | "nao_encontrada" | "token_invalido" | "expirada" | "body_invalido"> => {
  const parseado = parsePontoCapgo(body);
  if (!parseado.ok) {
    return "body_invalido";
  }

  const atual = await telemetriaSessaoRepository.buscarPorId(sessaoId);
  if (!atual) {
    return "nao_encontrada";
  }
  if (!tokensIguais(tokenPlain, atual.tokenHash)) {
    return "token_invalido";
  }
  if (sessaoExpirada(atual.iniciadoEm)) {
    await telemetriaSessaoRepository.excluir(sessaoId);
    return "expirada";
  }

  const ok = await telemetriaSessaoRepository.aplicarPontoTransacao(
    sessaoId,
    atual.tokenHash,
    (estado) => aplicarPonto(estado, parseado.ponto),
  );
  return ok ? "ok" : "nao_encontrada";
};
