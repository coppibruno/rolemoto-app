import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  HistoricoOculto,
  HistoricoOcultoCreate,
  TipoHistoricoOculto,
} from "../../types/historico-oculto";
import type {HistoricoOcultoRepository} from "../interfaces/historico-oculto.repository";
import {toIso} from "./mapper";

const COLECAO = "usershistoricooculto";
const LIMITE = 200;

const idOculto = (
  usuarioId: string,
  tipo: TipoHistoricoOculto,
  alvoId: string,
): string => `${usuarioId}_${tipo}_${alvoId}`;

const toOculto = (snap: DocumentSnapshot): HistoricoOculto => {
  const data = snap.data() ?? {};
  const tipo = data.tipo === "evento" ? "evento" : "role";
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    tipo,
    alvoId: String(data.alvoId ?? ""),
    createdAt: toIso(data.createdAt),
  };
};

export class FirestoreHistoricoOcultoRepository
implements HistoricoOcultoRepository {
  async criar(dados: HistoricoOcultoCreate): Promise<HistoricoOculto> {
    const id = idOculto(dados.usuarioId, dados.tipo, dados.alvoId);
    const ref = firestore.collection(COLECAO).doc(id);
    const existente = await ref.get();
    if (existente.exists) {
      return toOculto(existente);
    }

    await ref.set({
      usuarioId: dados.usuarioId,
      tipo: dados.tipo,
      alvoId: dados.alvoId,
      createdAt: FieldValue.serverTimestamp(),
    });
    const criado = await ref.get();
    return toOculto(criado);
  }

  async listarPorUsuario(usuarioId: string): Promise<HistoricoOculto[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .limit(LIMITE)
      .get();
    return snap.docs.map(toOculto);
  }
}
