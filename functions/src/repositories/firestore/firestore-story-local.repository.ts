import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  AlbumStory,
  AlbumVisto,
  StoryLocal,
  StoryLocalCreate,
  StoryVisto,
  StoryVistoGravacao,
} from "../../types/story-local";
import type {StoryLocalRepository} from "../interfaces/story-local.repository";
import {toIso} from "./mapper";

const COLECAO = "userslocalstory";
const COLECAO_VISTO = "userslocalstoryvisto";
const JANELA_MS = 24 * 60 * 60 * 1000;

const textoOuNull = (valor: unknown): string | null => {
  if (typeof valor !== "string" || !valor.trim()) {
    return null;
  }
  return valor;
};

const porCriacao = (itens: StoryLocal[]): StoryLocal[] =>
  [...itens].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );

const percentual = (valor: unknown): number | null => {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    return null;
  }
  if (valor < 0 || valor > 100) {
    return null;
  }
  return valor;
};

const coordenada = (valor: unknown): number | null => {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    return null;
  }
  return valor;
};

const albumVisto = (valor: unknown): AlbumVisto => {
  if (valor === "evento" || valor === "perfil" || valor === "pessoa") {
    return valor;
  }
  return "local";
};

const toStory = (snap: DocumentSnapshot): StoryLocal => {
  const data = snap.data() ?? {};
  const album: AlbumStory = data.album === "evento" ?
    "evento" :
    data.album === "perfil" ? "perfil" : "local";
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    album,
    localId: textoOuNull(data.localId),
    eventoId: textoOuNull(data.eventoId),
    fotoUrl: String(data.fotoUrl ?? ""),
    storagePath: String(data.storagePath ?? ""),
    marcaX: percentual(data.marcaX),
    marcaY: percentual(data.marcaY),
    localizacaoNome: textoOuNull(data.localizacaoNome),
    localizacaoLat: coordenada(data.localizacaoLat),
    localizacaoLng: coordenada(data.localizacaoLng),
    createdAt: toIso(data.createdAt),
    expiresAt: toIso(data.expiresAt),
  };
};

const toVisto = (snap: DocumentSnapshot): StoryVisto => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    album: albumVisto(data.album),
    localId: textoOuNull(data.localId),
    eventoId: textoOuNull(data.eventoId),
    vistoAte: toIso(data.vistoAte),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreStoryLocalRepository implements StoryLocalRepository {
  async criar(dados: StoryLocalCreate): Promise<StoryLocal> {
    const agora = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(agora.toMillis() + JANELA_MS);
    const ref = await firestore.collection(COLECAO).add({
      usuarioId: dados.usuarioId,
      album: dados.album,
      localId: dados.localId,
      eventoId: dados.eventoId,
      fotoUrl: dados.fotoUrl,
      storagePath: dados.storagePath,
      marcaX: dados.marcaX,
      marcaY: dados.marcaY,
      localizacaoNome: dados.localizacaoNome,
      localizacaoLat: dados.localizacaoLat,
      localizacaoLng: dados.localizacaoLng,
      createdAt: agora,
      expiresAt,
    });
    const criado = await this.buscarPorId(ref.id);
    return criado as StoryLocal;
  }

  async buscarPorId(id: string): Promise<StoryLocal | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toStory(snap);
  }

  async listarAtivasLocal(
    localId: string,
    agora: Date,
    limite: number,
  ): Promise<StoryLocal[]> {
    return this.listarAtivas("local", "localId", localId, agora, limite);
  }

  async listarAtivasEvento(
    eventoId: string,
    agora: Date,
    limite: number,
  ): Promise<StoryLocal[]> {
    return this.listarAtivas("evento", "eventoId", eventoId, agora, limite);
  }

  async contarAtivasLocal(localId: string, agora: Date): Promise<number> {
    return this.contarAtivas("local", "localId", localId, agora);
  }

  async contarAtivasEvento(eventoId: string, agora: Date): Promise<number> {
    return this.contarAtivas("evento", "eventoId", eventoId, agora);
  }

  async contarRecentesLocal(
    usuarioId: string,
    localId: string,
    desde: Date,
  ): Promise<number> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .where("localId", "==", localId)
      .where("createdAt", ">", Timestamp.fromDate(desde))
      .orderBy("createdAt", "desc")
      .count()
      .get();
    return snap.data().count;
  }

  async contarRecentesEvento(
    usuarioId: string,
    eventoId: string,
    desde: Date,
  ): Promise<number> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .where("eventoId", "==", eventoId)
      .where("createdAt", ">", Timestamp.fromDate(desde))
      .orderBy("createdAt", "desc")
      .count()
      .get();
    return snap.data().count;
  }

  async listarRecentesNaoExpiradas(
    agora: Date,
    limite: number,
  ): Promise<StoryLocal[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("expiresAt", ">", Timestamp.fromDate(agora))
      .orderBy("expiresAt", "desc")
      .limit(limite)
      .get();
    return snap.docs.map(toStory);
  }

  async listarExpiradas(agora: Date, limite: number): Promise<StoryLocal[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("expiresAt", "<", Timestamp.fromDate(agora))
      .orderBy("expiresAt", "asc")
      .limit(limite)
      .get();
    return snap.docs.map(toStory);
  }

  async listarPorUsuario(
    usuarioId: string,
    limite: number,
  ): Promise<StoryLocal[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .limit(limite)
      .get();
    return snap.docs.map(toStory);
  }

  async remover(id: string): Promise<void> {
    await firestore.collection(COLECAO).doc(id).delete();
  }

  async buscarVistos(ids: string[]): Promise<StoryVisto[]> {
    const unicos = [...new Set(ids)].filter(Boolean);
    if (unicos.length === 0) {
      return [];
    }
    const encontrados: StoryVisto[] = [];
    for (let i = 0; i < unicos.length; i += 30) {
      const refs = unicos
        .slice(i, i + 30)
        .map((id) => firestore.collection(COLECAO_VISTO).doc(id));
      const snaps = await firestore.getAll(...refs);
      encontrados.push(...snaps.filter((snap) => snap.exists).map(toVisto));
    }
    return encontrados;
  }

  async registrarVisto(dados: StoryVistoGravacao): Promise<void> {
    const ref = firestore.collection(COLECAO_VISTO).doc(dados.id);
    const novo = Timestamp.fromDate(new Date(dados.vistoAte));
    await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        const atual = snap.get("vistoAte");
        if (atual instanceof Timestamp && atual.toMillis() >= novo.toMillis()) {
          return;
        }
      }
      tx.set(ref, {
        usuarioId: dados.usuarioId,
        album: dados.album,
        localId: dados.localId,
        eventoId: dados.eventoId,
        vistoAte: novo,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    });
  }

  private async listarAtivas(
    album: AlbumStory,
    campo: "localId" | "eventoId",
    id: string,
    agora: Date,
    limite: number,
  ): Promise<StoryLocal[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("album", "==", album)
      .where(campo, "==", id)
      .where("expiresAt", ">", Timestamp.fromDate(agora))
      .orderBy("expiresAt", "desc")
      .limit(limite)
      .get();
    return porCriacao(snap.docs.map(toStory));
  }

  private async contarAtivas(
    album: AlbumStory,
    campo: "localId" | "eventoId",
    id: string,
    agora: Date,
  ): Promise<number> {
    const snap = await firestore
      .collection(COLECAO)
      .where("album", "==", album)
      .where(campo, "==", id)
      .where("expiresAt", ">", Timestamp.fromDate(agora))
      .count()
      .get();
    return snap.data().count;
  }
}
