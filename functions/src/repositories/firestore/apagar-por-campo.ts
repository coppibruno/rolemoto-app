import {firestore} from "../../lib/firebase-admin";

const LOTE = 400;
const RODADAS = 50;

/** Apaga docs em que `campo` é igual a `valor`. Índice simples de igualdade. */
export const apagarPorCampo = async (
  colecao: string,
  campo: string,
  valor: string,
): Promise<number> => {
  let removidos = 0;
  for (let rodada = 0; rodada < RODADAS; rodada += 1) {
    const snap = await firestore
      .collection(colecao)
      .where(campo, "==", valor)
      .limit(LOTE)
      .get();
    if (snap.empty) {
      return removidos;
    }
    const batch = firestore.batch();
    snap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    removidos += snap.size;
    if (snap.size < LOTE) {
      return removidos;
    }
  }
  return removidos;
};
