import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {UsuarioOfertaCupomCreate} from "../../types/oferta-local";
import type {UsuarioOfertaCupomRepository} from "../interfaces/usuario-oferta-cupom.repository";
import {apagarPorCampo} from "./apagar-por-campo";

const COLECAO = "usersofertacupom";
const JA_EXISTE = 6;

export class FirestoreUsuarioOfertaCupomRepository implements UsuarioOfertaCupomRepository {
  async abrir(dados: UsuarioOfertaCupomCreate): Promise<{novo: boolean}> {
    const id = `${dados.usuarioId}_${dados.ofertaId}_${dados.ymd}`;
    try {
      await firestore.collection(COLECAO).doc(id).create({
        usuarioId: dados.usuarioId,
        ofertaId: dados.ofertaId,
        localId: dados.localId,
        createdAt: FieldValue.serverTimestamp(),
      });
      return {novo: true};
    } catch (error) {
      if ((error as {code?: unknown}).code === JA_EXISTE) {
        return {novo: false};
      }
      throw error;
    }
  }

  async contarPorLocalDesde(localId: string, desde: Date): Promise<number> {
    const snap = await firestore
      .collection(COLECAO)
      .where("localId", "==", localId)
      .where("createdAt", ">=", Timestamp.fromDate(desde))
      .orderBy("createdAt", "desc")
      .count()
      .get();
    return snap.data().count;
  }

  async removerPorLocal(localId: string): Promise<number> {
    return apagarPorCampo(COLECAO, "localId", localId);
  }
}
