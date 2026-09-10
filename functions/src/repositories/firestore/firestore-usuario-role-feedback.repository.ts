import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  TagFeedback,
  UsuarioRoleFeedbackCreate,
  UsuarioRoleFeedbackDoc,
} from "../../types/usuario-role-feedback";
import type {UsuarioRoleFeedbackRepository} from "../interfaces/usuario-role-feedback.repository";
import {toIso} from "./mapper";

const COLECAO = "usersrolefeedback";
const LIMITE_POR_ROLE = 100;
const CHUNK = 100;

const idFeedback = (usuarioId: string, roleId: string): string =>
  `${usuarioId}_${roleId}`;

const emChunks = <T>(itens: T[]): T[][] => {
  const saida: T[][] = [];
  for (let i = 0; i < itens.length; i += CHUNK) {
    saida.push(itens.slice(i, i + CHUNK));
  }
  return saida;
};

const paraTags = (valor: unknown): TagFeedback[] => {
  if (!Array.isArray(valor)) {
    return [];
  }
  return valor.filter((tag): tag is TagFeedback => typeof tag === "string");
};

const toDoc = (snap: DocumentSnapshot): UsuarioRoleFeedbackDoc => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    roleId: String(data.roleId ?? ""),
    nota: Number(data.nota ?? 0),
    tags: paraTags(data.tags),
    comentario: String(data.comentario ?? ""),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreUsuarioRoleFeedbackRepository
implements UsuarioRoleFeedbackRepository {
  async buscarPorId(id: string): Promise<UsuarioRoleFeedbackDoc | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toDoc(snap);
  }

  async buscarPorUsuarioERole(
    usuarioId: string,
    roleId: string,
  ): Promise<UsuarioRoleFeedbackDoc | null> {
    return this.buscarPorId(idFeedback(usuarioId, roleId));
  }

  async buscarPorIds(ids: string[]): Promise<UsuarioRoleFeedbackDoc[]> {
    const unicos = [...new Set(ids)].filter(Boolean);
    if (unicos.length === 0) {
      return [];
    }

    const encontrados: UsuarioRoleFeedbackDoc[] = [];
    for (const chunk of emChunks(unicos)) {
      const refs = chunk.map((id) => firestore.collection(COLECAO).doc(id));
      const snaps = await firestore.getAll(...refs);
      for (const snap of snaps) {
        if (snap.exists) {
          encontrados.push(toDoc(snap));
        }
      }
    }
    return encontrados;
  }

  async listarPorRole(roleId: string): Promise<UsuarioRoleFeedbackDoc[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("roleId", "==", roleId)
      .orderBy("createdAt", "desc")
      .limit(LIMITE_POR_ROLE)
      .get();
    return snap.docs.map(toDoc);
  }

  async criar(
    dados: UsuarioRoleFeedbackCreate,
  ): Promise<UsuarioRoleFeedbackDoc | "conflito"> {
    const id = idFeedback(dados.usuarioId, dados.roleId);
    const ref = firestore.collection(COLECAO).doc(id);
    const existente = await ref.get();
    if (existente.exists) {
      return "conflito";
    }

    await ref.set({
      usuarioId: dados.usuarioId,
      roleId: dados.roleId,
      nota: dados.nota,
      tags: dados.tags,
      comentario: dados.comentario,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(id);
    return criado as UsuarioRoleFeedbackDoc;
  }
}
