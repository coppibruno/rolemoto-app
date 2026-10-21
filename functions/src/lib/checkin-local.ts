import {haversineKm} from "./geo";
import {
  agregadoCheckinVazio,
  aplicarCheckinUnico,
  paraSelosPublicos,
  seloNovoEntre,
} from "./selos";
import {
  usuarioLocalCheckinRepository,
  usuarioRepository,
} from "../repositories";
import type {CheckinLocalResposta} from "../types/checkin-local";
import type {Local} from "../types/local";

export const RAIO_CHECKIN_KM = 0.4;
export const PRECISAO_MAX_M = 80;
export const COOLDOWN_CHECKIN_MS = 24 * 60 * 60 * 1000;

export const ERRO_COORDS = "lat e lng são obrigatórios";
export const ERRO_PRECISAO = "GPS impreciso. Tente ao ar livre.";
export const ERRO_RAIO = "Chegue mais perto para marcar presença";
export const ERRO_COOLDOWN = "Você já marcou presença aqui hoje";

export type BodyCheckin = {
  lat: number;
  lng: number;
  accuracy: number;
};

type ResultadoValidacao =
  | {ok: true; dados: BodyCheckin}
  | {ok: false; erro: string};

const isCoordLat = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor) && valor >= -90 && valor <= 90;

const isCoordLng = (valor: unknown): valor is number =>
  typeof valor === "number" &&
  Number.isFinite(valor) &&
  valor >= -180 &&
  valor <= 180;

export const validarBodyCheckin = (body: unknown): ResultadoValidacao => {
  if (!body || typeof body !== "object") {
    return {ok: false, erro: ERRO_COORDS};
  }
  const bruto = body as Record<string, unknown>;
  if (!isCoordLat(bruto.lat) || !isCoordLng(bruto.lng)) {
    return {ok: false, erro: ERRO_COORDS};
  }
  if (typeof bruto.accuracy !== "number" || !Number.isFinite(bruto.accuracy)) {
    return {ok: false, erro: ERRO_PRECISAO};
  }
  if (bruto.accuracy < 0 || bruto.accuracy > PRECISAO_MAX_M) {
    return {ok: false, erro: ERRO_PRECISAO};
  }
  return {
    ok: true,
    dados: {lat: bruto.lat, lng: bruto.lng, accuracy: bruto.accuracy},
  };
};

export const validarPresenca = (
  local: Local,
  lat: number,
  lng: number,
): string | null => {
  const distanciaKm = haversineKm(lat, lng, local.lat, local.lng);
  if (distanciaKm > RAIO_CHECKIN_KM) {
    return ERRO_RAIO;
  }
  return null;
};

export const registrarCheckin = async (
  uid: string,
  local: Local,
  dados: BodyCheckin,
): Promise<
  | {ok: true; resposta: CheckinLocalResposta}
  | {ok: false; status: number; erro: string}
> => {
  const longe = validarPresenca(local, dados.lat, dados.lng);
  if (longe) {
    return {ok: false, status: 400, erro: longe};
  }

  const ultimo =
    await usuarioLocalCheckinRepository.buscarUltimoPorUsuarioELocal(
      uid,
      local.id,
    );
  if (ultimo) {
    const decorrido = Date.now() - Date.parse(ultimo.createdAt);
    if (Number.isFinite(decorrido) && decorrido < COOLDOWN_CHECKIN_MS) {
      return {ok: false, status: 409, erro: ERRO_COOLDOWN};
    }
  }

  const criado = await usuarioLocalCheckinRepository.criar({
    usuarioId: uid,
    localId: local.id,
    lat: dados.lat,
    lng: dados.lng,
  });

  const atual =
    (await usuarioRepository.buscarAgregadoCheckin(uid)) ??
    agregadoCheckinVazio();
  const proximo = aplicarCheckinUnico(atual, local.id, local.categoria);
  if (proximo !== atual) {
    await usuarioRepository.salvarAgregadoCheckin(uid, proximo);
  }

  return {
    ok: true,
    resposta: {
      id: criado.id,
      localId: criado.localId,
      createdAt: criado.createdAt,
      checkinProprio: true,
      seloNovo: seloNovoEntre(atual.selos, proximo.selos),
      selos: paraSelosPublicos(proximo.selos),
    },
  };
};
