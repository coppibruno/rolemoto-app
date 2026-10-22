import {firestore} from "../../lib/firebase-admin";

/** Grava `storyPushYmd` se ainda não for o dia. `true` = esta chamada envia o push. */
export const reservarYmd = async (
  colecao: string,
  id: string,
  ymd: string,
): Promise<boolean> => {
  const ref = firestore.collection(colecao).doc(id);
  return firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      return false;
    }
    if (String(snap.get("storyPushYmd") ?? "") === ymd) {
      return false;
    }
    tx.update(ref, {storyPushYmd: ymd});
    return true;
  });
};
