import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {Afiliado} from "../../types/afiliado";
import type {AfiliadoRepository} from "../interfaces/afiliado.repository";
import {toIso} from "./mapper";

const COLECAO = "afiliados";
const USUARIOS = "users";

const contador = (valor: unknown): number =>
  typeof valor === "number" && Number.isFinite(valor) && valor > 0 ? Math.floor(valor) : 0;

const toAfiliado = (snap: DocumentSnapshot): Afiliado => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    nome: String(data.nome ?? ""),
    cliques: contador(data.cliques),
    contas: contador(data.contas),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreAfiliadoRepository implements AfiliadoRepository {
  async listar(): Promise<Afiliado[]> {
    const snap = await firestore.collection(COLECAO).orderBy("createdAt", "desc").get();
    return snap.docs.map(toAfiliado);
  }

  async criar(codigo: string, nome: string): Promise<Afiliado | null> {
    const ref = firestore.collection(COLECAO).doc(codigo);
    const criou = await firestore.runTransaction(async (tx) => {
      const atual = await tx.get(ref);
      if (atual.exists) {
        return false;
      }
      tx.create(ref, {
        nome,
        cliques: 0,
        contas: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    return criou ? toAfiliado(await ref.get()) : null;
  }

  async atualizarNome(codigo: string, nome: string): Promise<Afiliado | null> {
    const ref = firestore.collection(COLECAO).doc(codigo);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update({nome, updatedAt: FieldValue.serverTimestamp()});
    return toAfiliado(await ref.get());
  }

  async registrarClique(codigo: string): Promise<boolean> {
    const ref = firestore.collection(COLECAO).doc(codigo);
    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        return false;
      }
      tx.update(ref, {cliques: FieldValue.increment(1)});
      return true;
    });
  }

  async vincularConta(uid: string, codigo: string): Promise<boolean> {
    const afiliadoRef = firestore.collection(COLECAO).doc(codigo);
    const usuarioRef = firestore.collection(USUARIOS).doc(uid);
    return firestore.runTransaction(async (tx) => {
      const afiliado = await tx.get(afiliadoRef);
      const usuario = await tx.get(usuarioRef);
      if (!afiliado.exists || !usuario.exists) {
        return false;
      }
      const atual = usuario.get("afiliadoCodigo");
      if (typeof atual === "string" && atual) {
        return false;
      }
      tx.update(usuarioRef, {afiliadoCodigo: codigo});
      tx.update(afiliadoRef, {contas: FieldValue.increment(1)});
      return true;
    });
  }
}
