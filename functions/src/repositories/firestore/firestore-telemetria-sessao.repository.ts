import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import type {EstadoCalculo} from "../../lib/calcular-metricas-telemetria";
import {firestore} from "../../lib/firebase-admin";
import type {
  TelemetriaSessao,
  TelemetriaSessaoNovo,
} from "../../types/telemetria-sessao";
import type {
  TelemetriaSessaoInterna,
  TelemetriaSessaoRepository,
} from "../interfaces/telemetria-sessao.repository";
import {toIso} from "./mapper";

const COLECAO = "telemetriasessao";

const toCoord = (
  valor: unknown,
): {lat: number; lng: number; t: number} | null => {
  if (!valor || typeof valor !== "object") return null;
  const o = valor as Record<string, unknown>;
  if (
    typeof o.lat !== "number" ||
    typeof o.lng !== "number" ||
    typeof o.t !== "number"
  ) {
    return null;
  }
  return {lat: o.lat, lng: o.lng, t: o.t};
};

const toDoc = (snap: DocumentSnapshot): TelemetriaSessaoInterna => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    tokenHash: String(data.tokenHash ?? ""),
    iniciadoEm: toIso(data.iniciadoEm),
    distanciaKm: Number(data.distanciaKm ?? 0),
    velocidadeMaxKmh: Number(data.velocidadeMaxKmh ?? 0),
    tempoMovimentoSegundos: Number(data.tempoMovimentoSegundos ?? 0),
    primeiro: toCoord(data.primeiro),
    ultimo: toCoord(data.ultimo),
    paradoDesde:
      typeof data.paradoDesde === "number" ? data.paradoDesde : null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

const estadoDe = (doc: TelemetriaSessaoInterna): EstadoCalculo => ({
  distanciaKm: doc.distanciaKm,
  velocidadeMaxKmh: doc.velocidadeMaxKmh,
  tempoMovimentoSegundos: doc.tempoMovimentoSegundos,
  primeiro: doc.primeiro,
  ultimo: doc.ultimo,
  paradoDesde: doc.paradoDesde,
});

export class FirestoreTelemetriaSessaoRepository
implements TelemetriaSessaoRepository {
  async criar(dados: TelemetriaSessaoNovo): Promise<TelemetriaSessao> {
    const ref = await firestore.collection(COLECAO).add({
      usuarioId: dados.usuarioId,
      tokenHash: dados.tokenHash,
      iniciadoEm: dados.iniciadoEm,
      distanciaKm: dados.distanciaKm,
      velocidadeMaxKmh: dados.velocidadeMaxKmh,
      tempoMovimentoSegundos: dados.tempoMovimentoSegundos,
      primeiro: dados.primeiro,
      ultimo: dados.ultimo,
      paradoDesde: dados.paradoDesde,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(ref.id);
    if (!criado) {
      throw new Error("Falha ao criar sessão de telemetria");
    }
    const {tokenHash: _t, ...publico} = criado;
    return publico;
  }

  async buscarPorId(id: string): Promise<TelemetriaSessaoInterna | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toDoc(snap);
  }

  async aplicarPontoTransacao(
    id: string,
    tokenHash: string,
    aplicar: (estado: EstadoCalculo) => EstadoCalculo,
  ): Promise<boolean> {
    const ref = firestore.collection(COLECAO).doc(id);
    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        return false;
      }
      const atual = toDoc(snap);
      if (atual.tokenHash !== tokenHash) {
        return false;
      }
      const proximo = aplicar(estadoDe(atual));
      tx.update(ref, {
        distanciaKm: proximo.distanciaKm,
        velocidadeMaxKmh: proximo.velocidadeMaxKmh,
        tempoMovimentoSegundos: proximo.tempoMovimentoSegundos,
        primeiro: proximo.primeiro,
        ultimo: proximo.ultimo,
        paradoDesde: proximo.paradoDesde,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
  }

  async excluir(id: string): Promise<void> {
    await firestore.collection(COLECAO).doc(id).delete();
  }

  async excluirPorUsuario(usuarioId: string): Promise<void> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .get();
    if (snap.empty) return;
    const batch = firestore.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}
