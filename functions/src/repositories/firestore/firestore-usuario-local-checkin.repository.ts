import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  UsuarioLocalCheckin,
  UsuarioLocalCheckinCreate,
} from "../../types/checkin-local";
import type {UsuarioLocalCheckinRepository} from "../interfaces/usuario-local-checkin.repository";
import {toIso} from "./mapper";

const COLECAO = "userslocalcheckin";
const LIMITE_POR_USUARIO = 200;

const toCheckin = (snap: DocumentSnapshot): UsuarioLocalCheckin => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    localId: String(data.localId ?? ""),
    lat: Number(data.lat ?? 0),
    lng: Number(data.lng ?? 0),
    createdAt: toIso(data.createdAt),
  };
};

export class FirestoreUsuarioLocalCheckinRepository
implements UsuarioLocalCheckinRepository {
  async buscarUltimoPorUsuarioELocal(
    usuarioId: string,
    localId: string,
  ): Promise<UsuarioLocalCheckin | null> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .where("localId", "==", localId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    const doc = snap.docs[0];
    return doc ? toCheckin(doc) : null;
  }

  async listarPorUsuario(usuarioId: string): Promise<UsuarioLocalCheckin[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .orderBy("createdAt", "desc")
      .limit(LIMITE_POR_USUARIO)
      .get();
    return snap.docs.map(toCheckin);
  }

  async criar(
    dados: UsuarioLocalCheckinCreate,
  ): Promise<UsuarioLocalCheckin> {
    const ref = firestore.collection(COLECAO).doc();
    await ref.set({
      usuarioId: dados.usuarioId,
      localId: dados.localId,
      lat: dados.lat,
      lng: dados.lng,
      createdAt: FieldValue.serverTimestamp(),
    });
    const criado = await ref.get();
    return toCheckin(criado);
  }
}
