import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {Usuario, UsuarioCreate, UsuarioUpdate} from "../../types/usuario";
import type {UsuarioRepository} from "../interfaces/usuario.repository";
import {toIso} from "./mapper";

const COLECAO = "users";

const toUsuario = (snap: DocumentSnapshot): Usuario => {
  const data = snap.data() ?? {};
  return {
    uid: snap.id,
    nome: String(data.nome ?? ""),
    apelido: String(data.apelido ?? ""),
    moto: String(data.moto ?? ""),
    pilotagem: data.pilotagem ?? "tranquila",
    fotoUrl: String(data.fotoUrl ?? ""),
    cidade: String(data.cidade ?? ""),
    createdAt: toIso(data.createdAt),
  };
};

export class FirestoreUsuarioRepository implements UsuarioRepository {
  async buscarPorId(uid: string): Promise<Usuario | null> {
    const snap = await firestore.collection(COLECAO).doc(uid).get();
    if (!snap.exists) {
      return null;
    }
    return toUsuario(snap);
  }

  async criar(uid: string, dados: UsuarioCreate): Promise<Usuario> {
    const ref = firestore.collection(COLECAO).doc(uid);
    await ref.set({
      ...dados,
      createdAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(uid);
    return criado as Usuario;
  }

  async atualizar(
    uid: string,
    dados: UsuarioUpdate,
  ): Promise<Usuario | null> {
    const ref = firestore.collection(COLECAO).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update({...dados});
    return this.buscarPorId(uid);
  }

  async remover(uid: string): Promise<boolean> {
    const ref = firestore.collection(COLECAO).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return false;
    }
    await ref.delete();
    return true;
  }
}
