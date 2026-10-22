import {RAIO_CHECKIN_KM, validarBodyCheckin} from "./checkin-local";
import {haversineKm} from "./geo";
import {eventoEstaAoVivo} from "./story-local";
import {
  eventoRepository,
  localRepository,
  usuarioRepository,
} from "../repositories";
import type {Evento} from "../types/evento";
import type {Local} from "../types/local";

export type PontoProximo = {
  tipo: "local" | "evento";
  id: string;
  localId: string | null;
  eventoId: string | null;
  nome: string;
  fotoUrl: string;
  checkinProprio: boolean;
};

type ComDistancia<T> = {item: T; km: number};

const maisPerto = <T extends {lat: number; lng: number}>(
  itens: T[],
  lat: number,
  lng: number,
): ComDistancia<T> | null => {
  let melhor: ComDistancia<T> | null = null;
  for (const item of itens) {
    const km = haversineKm(lat, lng, item.lat, item.lng);
    if (km > RAIO_CHECKIN_KM) {
      continue;
    }
    if (!melhor || km < melhor.km) {
      melhor = {item, km};
    }
  }
  return melhor;
};

const eventoQueVeste = async (localId: string): Promise<Evento | null> => {
  const candidatos = await eventoRepository.listarPorLocalId(localId, 5);
  return candidatos.find((evento) => eventoEstaAoVivo(evento)) ?? null;
};

const doLocal = async (
  uid: string,
  local: Local,
): Promise<PontoProximo> => {
  const [vestindo, agregado] = await Promise.all([
    eventoQueVeste(local.id),
    usuarioRepository.buscarAgregadoCheckin(uid),
  ]);
  const checkinProprio = Boolean(
    agregado?.locaisVisitadosIds.includes(local.id),
  );
  if (vestindo) {
    return {
      tipo: "evento",
      id: vestindo.id,
      localId: local.id,
      eventoId: vestindo.id,
      nome: vestindo.titulo,
      fotoUrl: vestindo.fotoCapaUrl || local.fotoFachadaUrl,
      checkinProprio,
    };
  }
  return {
    tipo: "local",
    id: local.id,
    localId: local.id,
    eventoId: null,
    nome: local.nome,
    fotoUrl: local.fotoFachadaUrl,
    checkinProprio,
  };
};

const doEvento = (evento: Evento): PontoProximo => ({
  tipo: "evento",
  id: evento.id,
  localId: evento.localId,
  eventoId: evento.id,
  nome: evento.titulo,
  fotoUrl: evento.fotoCapaUrl,
  checkinProprio: false,
});

export const buscarPontoProximo = async (
  uid: string,
  body: unknown,
): Promise<{ok: true; ponto: PontoProximo | null} | {ok: false; erro: string}> => {
  const gps = validarBodyCheckin(body);
  if (!gps.ok) {
    return {ok: false, erro: gps.erro};
  }

  const {lat, lng} = gps.dados;
  const locais = await localRepository.listar();
  const localPerto = maisPerto(locais, lat, lng);
  if (localPerto) {
    return {ok: true, ponto: await doLocal(uid, localPerto.item)};
  }

  const vivos = (await eventoRepository.listarFuturos())
    .filter((evento) => eventoEstaAoVivo(evento))
    .map((evento) => ({
      ...evento,
      lat: evento.local.lat,
      lng: evento.local.lng,
    }));
  const eventoPerto = maisPerto(vivos, lat, lng);
  if (!eventoPerto) {
    return {ok: true, ponto: null};
  }
  if (eventoPerto.item.localId) {
    const local = await localRepository.buscarPorId(eventoPerto.item.localId);
    if (local) {
      return {ok: true, ponto: await doLocal(uid, local)};
    }
  }
  return {ok: true, ponto: doEvento(eventoPerto.item)};
};
