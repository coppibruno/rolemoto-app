import type {DocumentReference, DocumentSnapshot, Query} from "firebase-admin/firestore";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {erroDe, log} from "../../lib/log";
import type {
  ComentarioPost,
  ComentarioPostCreate,
  Pagina,
  PostFoto,
  PostFotoCreate,
  ResultadoComentar,
} from "../../types/post-foto";
import {LIMITE_PAGINA_COMENTARIOS, LIMITE_PAGINA_POSTS} from "../../types/post-foto";
import type {PostFotoRepository} from "../interfaces/post-foto.repository";
import {toIso} from "./mapper";

const COLECAO = "userspostfoto";
const COLECAO_COMENTARIO = "userspostcomentario";
const LOTE = 100;
const RODADAS_LIMPEZA = 50;

const textoOuNull = (valor: unknown): string | null =>
  typeof valor === "string" && valor.trim() ? valor : null;

const contador = (valor: unknown): number =>
  typeof valor === "number" && Number.isFinite(valor) && valor > 0 ? Math.floor(valor) : 0;

const toPost = (snap: DocumentSnapshot): PostFoto => {
  const data = snap.data() ?? {};
  const marcaTipo = data.marcaTipo === "local" || data.marcaTipo === "evento" ?
    data.marcaTipo :
    null;
  const marcaId = textoOuNull(data.marcaId);
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    fotoUrl: String(data.fotoUrl ?? ""),
    storagePath: String(data.storagePath ?? ""),
    legenda: typeof data.legenda === "string" ? data.legenda : "",
    marcaTipo: marcaTipo && marcaId ? marcaTipo : null,
    marcaId: marcaTipo && marcaId ? marcaId : null,
    totalComentarios: contador(data.totalComentarios),
    createdAt: toIso(data.createdAt),
  };
};

const toComentario = (snap: DocumentSnapshot): ComentarioPost => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    postId: String(data.postId ?? ""),
    usuarioId: String(data.usuarioId ?? ""),
    texto: String(data.texto ?? ""),
    createdAt: toIso(data.createdAt),
  };
};

const paginar = async <T>(
  consulta: Query,
  cursorRef: DocumentReference | null,
  pertence: (snap: DocumentSnapshot) => boolean,
  limite: number,
  converter: (snap: DocumentSnapshot) => T & {id: string},
): Promise<Pagina<T>> => {
  let pagina = consulta.limit(limite);
  if (cursorRef) {
    const cursorSnap = await cursorRef.get();
    if (!cursorSnap.exists || !pertence(cursorSnap)) {
      return {ok: false};
    }
    pagina = pagina.startAfter(cursorSnap);
  }
  const snap = await pagina.get();
  const itens = snap.docs.map(converter);
  const ultimo = itens[itens.length - 1];
  return {
    ok: true,
    itens,
    proximoCursor: snap.size === limite && ultimo ? ultimo.id : null,
  };
};

export class FirestorePostFotoRepository implements PostFotoRepository {
  async criarDentroDoTeto(
    dados: PostFotoCreate,
    desde: Date,
    dentroDoTeto: (quantidade: number) => boolean,
  ): Promise<PostFoto | null> {
    const ref = firestore.collection(COLECAO).doc();
    const criou = await firestore.runTransaction(async (tx) => {
      const recentes = await tx.get(firestore
        .collection(COLECAO)
        .where("usuarioId", "==", dados.usuarioId)
        .where("createdAt", ">", Timestamp.fromDate(desde))
        .orderBy("createdAt", "desc")
        .limit(50));
      if (!dentroDoTeto(recentes.size)) {
        return false;
      }
      tx.create(ref, {
        usuarioId: dados.usuarioId,
        fotoUrl: dados.fotoUrl,
        storagePath: dados.storagePath,
        legenda: dados.legenda,
        marcaTipo: dados.marcaTipo,
        marcaId: dados.marcaId,
        totalComentarios: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    return criou ? this.buscarPorId(ref.id) : null;
  }

  async buscarPorId(id: string): Promise<PostFoto | null> {
    if (!id || id.includes("/")) {
      return null;
    }
    const snap = await firestore.collection(COLECAO).doc(id).get();
    return snap.exists ? toPost(snap) : null;
  }

  async buscarPorIds(ids: string[]): Promise<PostFoto[]> {
    const unicos = [...new Set(ids)].filter((id) => id && !id.includes("/"));
    const encontrados: PostFoto[] = [];
    for (let i = 0; i < unicos.length; i += LOTE) {
      const refs = unicos
        .slice(i, i + LOTE)
        .map((id) => firestore.collection(COLECAO).doc(id));
      const snaps = await firestore.getAll(...refs);
      encontrados.push(...snaps.filter((snap) => snap.exists).map(toPost));
    }
    return encontrados;
  }

  async listarPorUsuario(
    usuarioId: string,
    cursor: string | null,
  ): Promise<Pagina<PostFoto>> {
    if (cursor?.includes("/")) {
      return {ok: false};
    }
    return paginar(
      firestore
        .collection(COLECAO)
        .where("usuarioId", "==", usuarioId)
        .orderBy("createdAt", "desc"),
      cursor ? firestore.collection(COLECAO).doc(cursor) : null,
      (snap) => snap.get("usuarioId") === usuarioId,
      LIMITE_PAGINA_POSTS,
      toPost,
    );
  }

  async remover(id: string): Promise<void> {
    await this.apagarComentariosDoPost(id);
    await firestore.collection(COLECAO).doc(id).delete();
  }

  async listarComentarios(
    postId: string,
    cursor: string | null,
  ): Promise<Pagina<ComentarioPost>> {
    if (cursor?.includes("/")) {
      return {ok: false};
    }
    return paginar(
      firestore
        .collection(COLECAO_COMENTARIO)
        .where("postId", "==", postId)
        .orderBy("createdAt", "desc"),
      cursor ? firestore.collection(COLECAO_COMENTARIO).doc(cursor) : null,
      (snap) => snap.get("postId") === postId,
      LIMITE_PAGINA_COMENTARIOS,
      toComentario,
    );
  }

  async buscarComentario(id: string): Promise<ComentarioPost | null> {
    if (!id || id.includes("/")) {
      return null;
    }
    const snap = await firestore.collection(COLECAO_COMENTARIO).doc(id).get();
    return snap.exists ? toComentario(snap) : null;
  }

  async comentar(dados: ComentarioPostCreate): Promise<ResultadoComentar> {
    const postRef = firestore.collection(COLECAO).doc(dados.postId);
    const ref = firestore.collection(COLECAO_COMENTARIO).doc();
    const criou = await firestore.runTransaction(async (tx) => {
      const post = await tx.get(postRef);
      if (!post.exists) {
        return false;
      }
      tx.create(ref, {
        postId: dados.postId,
        usuarioId: dados.usuarioId,
        texto: dados.texto,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(postRef, {totalComentarios: contador(post.get("totalComentarios")) + 1});
      return true;
    });
    if (!criou) {
      return {tipo: "post_ausente"};
    }
    const comentario = await this.buscarComentario(ref.id);
    return {tipo: "criado", comentario: comentario as ComentarioPost};
  }

  async apagarComentario(comentario: ComentarioPost): Promise<void> {
    const ref = firestore.collection(COLECAO_COMENTARIO).doc(comentario.id);
    const postRef = comentario.postId ?
      firestore.collection(COLECAO).doc(comentario.postId) :
      null;
    await firestore.runTransaction(async (tx) => {
      const atual = await tx.get(ref);
      if (!atual.exists) {
        return;
      }
      const post = postRef ? await tx.get(postRef) : null;
      tx.delete(ref);
      if (postRef && post?.exists) {
        tx.update(postRef, {
          totalComentarios: Math.max(0, contador(post.get("totalComentarios")) - 1),
        });
      }
    });
  }

  async limparPorUsuario(usuarioId: string): Promise<string[]> {
    const caminhos: string[] = [];
    for (let rodada = 0; rodada < RODADAS_LIMPEZA; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO)
        .where("usuarioId", "==", usuarioId)
        .limit(LOTE)
        .get();
      if (snap.empty) {
        break;
      }
      for (const doc of snap.docs) {
        await this.remover(doc.id);
        const caminho = String(doc.get("storagePath") ?? "");
        if (caminho) {
          caminhos.push(caminho);
        }
      }
      if (snap.size < LOTE) {
        break;
      }
    }

    const vistos = new Set<string>();
    for (let rodada = 0; rodada < RODADAS_LIMPEZA; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO_COMENTARIO)
        .where("usuarioId", "==", usuarioId)
        .limit(LOTE)
        .get();
      const novos = snap.docs.filter((doc) => !vistos.has(doc.id));
      if (novos.length === 0) {
        break;
      }
      for (const doc of novos) {
        vistos.add(doc.id);
        try {
          await this.apagarComentario(toComentario(doc));
        } catch (error) {
          log.warn("PostFoto", "Falha ao apagar comentário na exclusão", {
            usuarioId,
            comentarioId: doc.id,
            ...erroDe(error),
          });
        }
      }
      if (snap.size < LOTE) {
        break;
      }
    }
    return caminhos;
  }

  private async apagarComentariosDoPost(postId: string): Promise<void> {
    for (let rodada = 0; rodada < RODADAS_LIMPEZA; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO_COMENTARIO)
        .where("postId", "==", postId)
        .limit(LOTE)
        .get();
      if (snap.empty) {
        return;
      }
      const lote = firestore.batch();
      snap.docs.forEach((doc) => lote.delete(doc.ref));
      await lote.commit();
      if (snap.size < LOTE) {
        return;
      }
    }
  }
}
