import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  UsuarioEvento,
  UsuarioEventoCreate,
} from "../../types/usuario-evento";
import type {UsuarioEventoRepository} from "../interfaces/usuario-evento.repository";
import {toIso} from "./mapper";

const COLECAO = "usersevento";
const LIMITE_POR_USUARIO = 100;
const LIMITE_POR_EVENTO = 500;

const idUsuarioEvento = (usuarioId: string, eventoId: string): string =>
  `${usuarioId}_${eventoId}`;

const toUsuarioEvento = (snap: DocumentSnapshot): UsuarioEvento => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    eventoId: String(data.eventoId ?? ""),
    criadorId: String(data.criadorId ?? ""),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreUsuarioEventoRepository
implements UsuarioEventoRepository {
  async buscarPorId(id: string): Promise<UsuarioEvento | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toUsuarioEvento(snap);
  }

  async buscarPorUsuarioEEvento(
    usuarioId: string,
    eventoId: string,
  ): Promise<UsuarioEvento | null> {
    return this.buscarPorId(idUsuarioEvento(usuarioId, eventoId));
  }

  async listarPorUsuario(usuarioId: string): Promise<UsuarioEvento[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .limit(LIMITE_POR_USUARIO)
      .get();
    return snap.docs.map(toUsuarioEvento);
  }

  async listarPorEvento(eventoId: string): Promise<UsuarioEvento[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("eventoId", "==", eventoId)
      .limit(LIMITE_POR_EVENTO)
      .get();
    return snap.docs.map(toUsuarioEvento);
  }

  async listarDestaquesDoEvento(
    eventoId: string,
    limite: number,
  ): Promise<UsuarioEvento[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("eventoId", "==", eventoId)
      .limit(Math.max(1, Math.min(limite, LIMITE_POR_EVENTO)))
      .get();
    return snap.docs.map(toUsuarioEvento);
  }

  async contarPorEvento(eventoId: string): Promise<number> {
    const snap = await firestore
      .collection(COLECAO)
      .where("eventoId", "==", eventoId)
      .count()
      .get();
    return snap.data().count;
  }

  async contarPorEventos(ids: string[]): Promise<Map<string, number>> {
    const unicos = [...new Set(ids)].filter(Boolean);
    const mapa = new Map<string, number>();
    await Promise.all(
      unicos.map(async (id) => {
        const n = await this.contarPorEvento(id);
        mapa.set(id, n);
      }),
    );
    return mapa;
  }

  async contarPorUsuario(usuarioId: string): Promise<number> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .count()
      .get();
    return snap.data().count;
  }

  async criar(dados: UsuarioEventoCreate): Promise<UsuarioEvento> {
    const id = idUsuarioEvento(dados.usuarioId, dados.eventoId);
    const ref = firestore.collection(COLECAO).doc(id);
    const existente = await ref.get();
    if (existente.exists) {
      return toUsuarioEvento(existente);
    }

    await ref.set({
      usuarioId: dados.usuarioId,
      eventoId: dados.eventoId,
      criadorId: dados.criadorId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(id);
    return criado as UsuarioEvento;
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
