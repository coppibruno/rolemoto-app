import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  UsuarioLocalFavorito,
  UsuarioLocalFavoritoCreate,
} from "../../types/favorito-local";
import type {UsuarioLocalFavoritoRepository} from "../interfaces/usuario-local-favorito.repository";
import {toIso} from "./mapper";

const COLECAO = "userslocalfavorito";
const LIMITE_POR_USUARIO = 100;

const idFavorito = (usuarioId: string, localId: string): string =>
  `${usuarioId}_${localId}`;

const toFavorito = (snap: DocumentSnapshot): UsuarioLocalFavorito => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    localId: String(data.localId ?? ""),
    createdAt: toIso(data.createdAt),
  };
};

export class FirestoreUsuarioLocalFavoritoRepository
implements UsuarioLocalFavoritoRepository {
  async buscarPorId(id: string): Promise<UsuarioLocalFavorito | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toFavorito(snap);
  }

  async buscarPorUsuarioELocal(
    usuarioId: string,
    localId: string,
  ): Promise<UsuarioLocalFavorito | null> {
    return this.buscarPorId(idFavorito(usuarioId, localId));
  }

  async criar(
    dados: UsuarioLocalFavoritoCreate,
  ): Promise<UsuarioLocalFavorito> {
    const id = idFavorito(dados.usuarioId, dados.localId);
    const ref = firestore.collection(COLECAO).doc(id);
    const existente = await ref.get();
    if (existente.exists) {
      return toFavorito(existente);
    }

    await ref.set({
      usuarioId: dados.usuarioId,
      localId: dados.localId,
      createdAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(id);
    return criado as UsuarioLocalFavorito;
  }

  async remover(id: string): Promise<boolean> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return false;
    }
    await ref.delete();
    return true;
  }

  async listarPorUsuario(usuarioId: string): Promise<UsuarioLocalFavorito[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .orderBy("createdAt", "desc")
      .limit(LIMITE_POR_USUARIO)
      .get();
    return snap.docs.map(toFavorito);
  }

  async listarLocalIdsPorUsuario(usuarioId: string): Promise<string[]> {
    const itens = await this.listarPorUsuario(usuarioId);
    return itens.map((item) => item.localId);
  }

  async contarPorUsuario(usuarioId: string): Promise<number> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .count()
      .get();
    return snap.data().count;
  }
}
