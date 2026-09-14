import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {Role, RoleCreate, RoleUpdate} from "../../types/role";
import type {
  CriteriosListagemRoles,
  RoleRepository,
} from "../interfaces/role.repository";
import {toIso, toTimestamp} from "./mapper";

const COLECAO = "roles";
const LIMITE_LISTAGEM = 200;
const LIMITE_POR_CRIADOR = 50;
const CHUNK = 100;

const emChunks = <T>(itens: T[]): T[][] => {
  const saida: T[][] = [];
  for (let i = 0; i < itens.length; i += CHUNK) {
    saida.push(itens.slice(i, i + CHUNK));
  }
  return saida;
};

const toRole = (snap: DocumentSnapshot): Role => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    titulo: String(data.titulo ?? ""),
    descricao: String(data.descricao ?? ""),
    fotoCapaUrl: String(data.fotoCapaUrl ?? ""),
    ritmo: data.ritmo ?? "tranquila",
    dataHoraSaida: toIso(data.dataHoraSaida),
    localSaida: {
      lat: data.localSaida?.lat ?? 0,
      lng: data.localSaida?.lng ?? 0,
      endereco: String(data.localSaida?.endereco ?? ""),
      nome: String(data.localSaida?.nome ?? ""),
    },
    destinoFinal: {
      lat: data.destinoFinal?.lat ?? 0,
      lng: data.destinoFinal?.lng ?? 0,
      endereco: String(data.destinoFinal?.endereco ?? ""),
      nome: String(data.destinoFinal?.nome ?? ""),
    },
    criadorId: String(data.criadorId ?? ""),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreRoleRepository implements RoleRepository {
  async listar(criterios: CriteriosListagemRoles): Promise<Role[]> {
    let consulta = firestore
      .collection(COLECAO)
      .where("dataHoraSaida", ">=", toTimestamp(criterios.dataInicioIso));

    if (criterios.dataFimIso) {
      consulta = consulta.where(
        "dataHoraSaida",
        "<=",
        toTimestamp(criterios.dataFimIso),
      );
    }
    if (criterios.ritmo) {
      consulta = consulta.where("ritmo", "==", criterios.ritmo);
    }

    const snap = await consulta
      .orderBy("dataHoraSaida", "asc")
      .limit(LIMITE_LISTAGEM)
      .get();
    return snap.docs.map(toRole);
  }

  async listarPorCriador(criadorId: string): Promise<Role[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("criadorId", "==", criadorId)
      .orderBy("dataHoraSaida", "desc")
      .limit(LIMITE_POR_CRIADOR)
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

  async buscarPorIds(ids: string[]): Promise<Role[]> {
    const unicos = [...new Set(ids)].filter(Boolean);
    if (unicos.length === 0) {
      return [];
    }

    const encontrados: Role[] = [];
    for (const chunk of emChunks(unicos)) {
      const refs = chunk.map((id) => firestore.collection(COLECAO).doc(id));
      const snaps = await firestore.getAll(...refs);
      for (const snap of snaps) {
        if (snap.exists) {
          encontrados.push(toRole(snap));
        }
      }
    }
    return encontrados;
  }

  async criar(dados: RoleCreate): Promise<Role> {
    const ref = await firestore.collection(COLECAO).add({
      titulo: dados.titulo,
      descricao: dados.descricao,
      fotoCapaUrl: dados.fotoCapaUrl,
      ritmo: dados.ritmo,
      dataHoraSaida: toTimestamp(dados.dataHoraSaida),
      localSaida: dados.localSaida,
      destinoFinal: dados.destinoFinal,
      criadorId: dados.criadorId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
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
    delete payload.criadorId;
    delete payload.id;
    delete payload.createdAt;
    if (dados.dataHoraSaida !== undefined) {
      payload.dataHoraSaida = toTimestamp(dados.dataHoraSaida);
    }
    payload.updatedAt = FieldValue.serverTimestamp();
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
