import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {dentroJanelaDedupe} from "../../lib/moderacao";
import type {
  AlvoDenuncia,
  Denuncia,
  DenunciaCreate,
  ResultadoDenunciar,
} from "../../types/moderacao";
import type {DenunciaRepository} from "../interfaces/denuncia.repository";
import {toIso} from "./mapper";
import {apagarPorCampo} from "./apagar-por-campo";

const COLECAO = "usersdenuncia";

const toDenuncia = (snap: DocumentSnapshot): Denuncia => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    denuncianteId: String(data.denuncianteId ?? ""),
    alvoTipo: data.alvoTipo as AlvoDenuncia,
    alvoId: String(data.alvoId ?? ""),
    acusadoId: String(data.acusadoId ?? ""),
    motivo: data.motivo as Denuncia["motivo"],
    detalhes: String(data.detalhes ?? ""),
    status: data.status === "resolvida" ? "resolvida" : "aberta",
    createdAt: toIso(data.createdAt),
  };
};

export class FirestoreDenunciaRepository implements DenunciaRepository {
  async buscarRecente(
    denuncianteId: string,
    alvoTipo: AlvoDenuncia,
    alvoId: string,
  ): Promise<Denuncia | null> {
    const snap = await firestore
      .collection(COLECAO)
      .where("denuncianteId", "==", denuncianteId)
      .where("alvoTipo", "==", alvoTipo)
      .where("alvoId", "==", alvoId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    const doc = snap.docs[0];
    return doc ? toDenuncia(doc) : null;
  }

  async criar(dados: DenunciaCreate): Promise<ResultadoDenunciar> {
    const recente = await this.buscarRecente(
      dados.denuncianteId,
      dados.alvoTipo,
      dados.alvoId,
    );
    if (recente && dentroJanelaDedupe(recente.createdAt)) {
      return {tipo: "duplicada"};
    }

    const ref = firestore.collection(COLECAO).doc();
    await ref.set({
      id: ref.id,
      denuncianteId: dados.denuncianteId,
      alvoTipo: dados.alvoTipo,
      alvoId: dados.alvoId,
      acusadoId: dados.acusadoId,
      motivo: dados.motivo,
      detalhes: dados.detalhes,
      status: "aberta",
      createdAt: FieldValue.serverTimestamp(),
    });
    return {tipo: "criada", id: ref.id};
  }

  async limparPorUsuario(uid: string): Promise<void> {
    await apagarPorCampo(COLECAO, "denuncianteId", uid);
    await apagarPorCampo(COLECAO, "acusadoId", uid);
  }
}
