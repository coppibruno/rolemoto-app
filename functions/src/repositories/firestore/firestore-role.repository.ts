import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {Role, RoleCreate, RoleUpdate} from "../../types/role";
import type {RoleRepository} from "../interfaces/role.repository";
import {toIso, toTimestamp} from "./mapper";

const COLECAO = "roles";

const toRole = (snap: DocumentSnapshot): Role => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    criadorId: String(data.criadorId ?? ""),
    dataHoraSaida: toIso(data.dataHoraSaida),
    localSaida: data.localSaida ?? {lat: 0, lng: 0, endereco: ""},
    destinoFinal: data.destinoFinal ?? {lat: 0, lng: 0, endereco: ""},
    categoria: data.categoria ?? "tranquilo",
    categoriaMotos: data.categoriaMotos ?? "todas",
    fotoUrl: String(data.fotoUrl ?? ""),
    participantes: Array.isArray(data.participantes) ?
      data.participantes :
      [],
    createdAt: toIso(data.createdAt),
  };
};

export class FirestoreRoleRepository implements RoleRepository {
  async listar(): Promise<Role[]> {
    const snap = await firestore
      .collection(COLECAO)
      .orderBy("dataHoraSaida", "asc")
      .get();
    return snap.docs.map(toRole);
  }

  async buscarPorId(id: string): Promise<Role | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toRole(snap);
  }

  async criar(dados: RoleCreate): Promise<Role> {
    const ref = await firestore.collection(COLECAO).add({
      criadorId: dados.criadorId,
      dataHoraSaida: toTimestamp(dados.dataHoraSaida),
      localSaida: dados.localSaida,
      destinoFinal: dados.destinoFinal,
      categoria: dados.categoria,
      categoriaMotos: dados.categoriaMotos,
      fotoUrl: dados.fotoUrl ?? "",
      participantes: dados.participantes ?? [dados.criadorId],
      createdAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(ref.id);
    return criado as Role;
  }

  async atualizar(id: string, dados: RoleUpdate): Promise<Role | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }

    const payload: Record<string, unknown> = {...dados};
    if (dados.dataHoraSaida !== undefined) {
      payload.dataHoraSaida = toTimestamp(dados.dataHoraSaida);
    }
    await ref.update(payload);
    return this.buscarPorId(id);
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
}
