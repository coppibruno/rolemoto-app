import {FieldValue, Timestamp, type DocumentData} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  TokenInstagramGuardado,
  TokenInstagramRepository,
} from "../interfaces/token-instagram.repository";

const COLECAO = "config";
const DOC = "instagram";

const prazoDe = (valor: unknown): number | null => {
  if (valor instanceof Timestamp) {
    return valor.toMillis();
  }
  if (valor instanceof Date) {
    return valor.getTime();
  }
  return null;
};

const lerGuardado = (dados: DocumentData | undefined): TokenInstagramGuardado | null => {
  if (!dados) {
    return null;
  }
  const token = dados.token;
  if (typeof token !== "string" || token.trim().length < 20) {
    return null;
  }
  const semente = typeof dados.semente === "string" ? dados.semente : "";
  return {
    accessToken: token.trim(),
    expiresAtMs: prazoDe(dados.expiresAt),
    semente,
  };
};

export class FirestoreTokenInstagramRepository implements TokenInstagramRepository {
  async ler(): Promise<TokenInstagramGuardado | null> {
    const snap = await firestore.collection(COLECAO).doc(DOC).get();
    return snap.exists ? lerGuardado(snap.data()) : null;
  }

  async salvar(token: TokenInstagramGuardado): Promise<void> {
    await firestore.collection(COLECAO).doc(DOC).set({
      token: token.accessToken,
      semente: token.semente,
      expiresAt: token.expiresAtMs == null ?
        null :
        Timestamp.fromMillis(token.expiresAtMs),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}
