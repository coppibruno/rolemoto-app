import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {MedalhaTelemetria, NovidadeMedalha} from "../../types/conquista";
import type {
  PontoTelemetria,
  RoleTelemetria,
  RoleTelemetriaNovo,
} from "../../types/role-telemetria";
import type {RoleTelemetriaRepository} from "../interfaces/role-telemetria.repository";
import {toIso, toTimestamp} from "./mapper";

const COLECAO = "rolestelemetria";
const LIMITE_PADRAO = 50;
const LIMITE_MAX = 100;

const toPonto = (valor: unknown): PontoTelemetria => {
  const o = valor && typeof valor === "object" ? (valor as Record<string, unknown>) : {};
  return {
    lat: Number(o.lat ?? 0),
    lng: Number(o.lng ?? 0),
    nome: String(o.nome ?? ""),
    endereco: String(o.endereco ?? ""),
  };
};

/** Sem o traçado: listas não precisam dos KB do polyline por item. */
const toResumo = (snap: DocumentSnapshot): RoleTelemetria => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    titulo: String(data.titulo ?? ""),
    velocidadeMaxKmh: Number(data.velocidadeMaxKmh ?? 0),
    velocidadeMediaKmh: Number(data.velocidadeMediaKmh ?? 0),
    distanciaKm: Number(data.distanciaKm ?? 0),
    tempoSegundos: Number(data.tempoSegundos ?? 0),
    tempoMovimentoSegundos: Number(data.tempoMovimentoSegundos ?? 0),
    iniciadoEm: toIso(data.iniciadoEm),
    encerradoEm: toIso(data.encerradoEm),
    pontoInicio: toPonto(data.pontoInicio),
    pontoFim: toPonto(data.pontoFim),
    publica: data.publica === undefined ? true : Boolean(data.publica),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

const NOVIDADES_MEDALHA = new Set<string>(["primeira", "recorde", "passagem"]);

const toMedalha = (valor: unknown): MedalhaTelemetria | null => {
  if (!valor || typeof valor !== "object") return null;
  const o = valor as Record<string, unknown>;
  const novidade = String(o.novidade ?? "");
  const conquistaId = String(o.conquistaId ?? "");
  if (!conquistaId || !NOVIDADES_MEDALHA.has(novidade)) return null;
  return {
    conquistaId,
    nome: String(o.nome ?? ""),
    lat: Number(o.lat ?? 0),
    lng: Number(o.lng ?? 0),
    velocidadeMaxKmh: Number(o.velocidadeMaxKmh ?? 0),
    novidade: novidade as NovidadeMedalha,
  };
};

const toMedalhas = (valor: unknown): MedalhaTelemetria[] =>
  Array.isArray(valor) ?
    valor.map(toMedalha).filter((m): m is MedalhaTelemetria => m !== null) :
    [];

const toDoc = (snap: DocumentSnapshot): RoleTelemetria => ({
  ...toResumo(snap),
  tracado: String(snap.data()?.tracado ?? ""),
  medalhas: toMedalhas(snap.data()?.medalhas),
});

export class FirestoreRoleTelemetriaRepository
implements RoleTelemetriaRepository {
  async buscarPorId(id: string): Promise<RoleTelemetria | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toDoc(snap);
  }

  async criar(dados: RoleTelemetriaNovo): Promise<RoleTelemetria> {
    const ref = await firestore.collection(COLECAO).add({
      usuarioId: dados.usuarioId,
      titulo: dados.titulo,
      velocidadeMaxKmh: dados.velocidadeMaxKmh,
      velocidadeMediaKmh: dados.velocidadeMediaKmh,
      distanciaKm: dados.distanciaKm,
      tempoSegundos: dados.tempoSegundos,
      tempoMovimentoSegundos: dados.tempoMovimentoSegundos,
      iniciadoEm: toTimestamp(dados.iniciadoEm),
      encerradoEm: toTimestamp(dados.encerradoEm),
      pontoInicio: dados.pontoInicio,
      pontoFim: dados.pontoFim,
      tracado: dados.tracado,
      publica: dados.publica,
      medalhas: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(ref.id);
    return criado as RoleTelemetria;
  }

  async listarPorUsuario(
    usuarioId: string,
    opcoes?: {limite?: number},
  ): Promise<RoleTelemetria[]> {
    const limite = Math.min(
      Math.max(opcoes?.limite ?? LIMITE_PADRAO, 1),
      LIMITE_MAX,
    );
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .orderBy("encerradoEm", "desc")
      .limit(limite)
      .get();
    return snap.docs.map(toResumo);
  }

  async atualizarVisibilidade(
    id: string,
    publica: boolean,
  ): Promise<RoleTelemetria | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update({
      publica,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return this.buscarPorId(id);
  }

  async atualizarMedalhas(
    id: string,
    medalhas: MedalhaTelemetria[],
  ): Promise<void> {
    await firestore.collection(COLECAO).doc(id).update({medalhas});
  }

  async excluir(id: string): Promise<void> {
    await firestore.collection(COLECAO).doc(id).delete();
  }
}
