import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {Dispositivo} from "../../types/dispositivo";
import type {DispositivoRepository} from "../interfaces/dispositivo.repository";
import {toIso} from "./mapper";

const COLECAO = "dispositivos";

/** Máximo de tokens ativos por uid; o restante (aparelhos mortos) é apagado. */
const TETO_TOKENS = 10;

const toDispositivo = (snap: DocumentSnapshot): Dispositivo => {
  const data = snap.data() ?? {};
  return {
    token: String(data.token ?? snap.id),
    uid: String(data.uid ?? ""),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreDispositivoRepository implements DispositivoRepository {
  async upsert(uid: string, token: string): Promise<Dispositivo> {
    const ref = firestore.collection(COLECAO).doc(token);
    const snap = await ref.get();
    const payload: Record<string, unknown> = {
      token,
      uid,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (!snap.exists) {
      payload.createdAt = FieldValue.serverTimestamp();
    }
    await ref.set(payload, {merge: true});
    const atualizado = await this.buscarPorToken(token);
    return atualizado as Dispositivo;
  }

  async buscarPorToken(token: string): Promise<Dispositivo | null> {
    const snap = await firestore.collection(COLECAO).doc(token).get();
    if (!snap.exists) {
      return null;
    }
    return toDispositivo(snap);
  }

  async listarTokensPorUid(uid: string): Promise<string[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("uid", "==", uid)
      .get();

    const ordenados = snap.docs
      .map((doc) => ({
        token: doc.id,
        updatedAt: toIso(doc.data()?.updatedAt),
      }))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

    const recentes = ordenados.slice(0, TETO_TOKENS);
    const restantes = ordenados.slice(TETO_TOKENS);
    await Promise.all(
      restantes.map((item) => this.removerPorToken(item.token)),
    );
    return recentes.map((item) => item.token);
  }

  async removerPorToken(token: string): Promise<boolean> {
    const ref = firestore.collection(COLECAO).doc(token);
    const snap = await ref.get();
    if (!snap.exists) {
      return false;
    }
    await ref.delete();
    return true;
  }

  async removerPorUid(uid: string): Promise<void> {
    const snap = await firestore
      .collection(COLECAO)
      .where("uid", "==", uid)
      .get();
    if (snap.empty) {
      return;
    }
    const batch = firestore.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}
