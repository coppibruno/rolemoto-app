import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {Usuario, UsuarioCreate, UsuarioUpdate} from "../../types/usuario";
import type {UsuarioRepository} from "../interfaces/usuario.repository";
import {toIso} from "./mapper";

const COLECAO = "users";
const CHUNK = 100;

const emChunks = <T>(itens: T[]): T[][] => {
  const saida: T[][] = [];
  for (let i = 0; i < itens.length; i += CHUNK) {
    saida.push(itens.slice(i, i + CHUNK));
  }
  return saida;
};

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
    garupaFrequente: Boolean(data.garupaFrequente),
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

  async buscarPorIds(uids: string[]): Promise<Usuario[]> {
    const unicos = [...new Set(uids)].filter(Boolean);
    if (unicos.length === 0) {
      return [];
    }

    const encontrados: Usuario[] = [];
    for (const chunk of emChunks(unicos)) {
      const refs = chunk.map((uid) => firestore.collection(COLECAO).doc(uid));
      const snaps = await firestore.getAll(...refs);
      for (const snap of snaps) {
        if (snap.exists) {
          encontrados.push(toUsuario(snap));
        }
      }
    }
    return encontrados;
  }

  async buscarPorApelido(apelido: string): Promise<Usuario[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("apelido", "==", apelido)
      .limit(2)
      .get();
    return snap.docs.map((doc) => toUsuario(doc));
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
