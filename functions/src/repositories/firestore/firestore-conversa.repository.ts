import type {DocumentSnapshot, Query} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  Conversa,
  Mensagem,
  MensagemNova,
  PaginaRepo,
} from "../../types/conversa";
import {
  LIMITE_PAGINA_CONVERSAS,
  LIMITE_PAGINA_MENSAGENS,
} from "../../types/conversa";
import {reacaoDe} from "../../lib/conversa";
import type {ConversaRepository} from "../interfaces/conversa.repository";
import {toIso} from "./mapper";

const CONVERSAS = "conversas";
const MENSAGENS = "mensagens";
const LOTE = 400;
const RODADAS_LIMPEZA = 50;

const toConversa = (snap: DocumentSnapshot): Conversa => {
  const data = snap.data() ?? {};
  const participantes = Array.isArray(data.participantes) ?
    data.participantes.filter((uid: unknown): uid is string => typeof uid === "string") :
    [];
  return {
    id: snap.id,
    participantes,
    ultimaMensagemTexto: String(data.ultimaMensagemTexto ?? ""),
    ultimaMensagemEm: toIso(data.ultimaMensagemEm),
    ultimaMensagemAutorId: String(data.ultimaMensagemAutorId ?? ""),
    naoLidaPor: Array.isArray(data.naoLidaPor) ?
      data.naoLidaPor.filter((uid: unknown): uid is string => typeof uid === "string") :
      [],
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

const toMensagem = (snap: DocumentSnapshot): Mensagem => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    conversaId: String(data.conversaId ?? ""),
    autorId: String(data.autorId ?? ""),
    texto: String(data.texto ?? ""),
    storyId: typeof data.storyId === "string" && data.storyId ? data.storyId : null,
    reacao: reacaoDe(data.reacao),
    createdAt: toIso(data.createdAt),
  };
};

const paginar = async <T extends {id: string}>(
  consulta: Query,
  colecao: string,
  cursor: string | null,
  pertence: (snap: DocumentSnapshot) => boolean,
  limite: number,
  converter: (snap: DocumentSnapshot) => T,
): Promise<PaginaRepo<T>> => {
  let pagina = consulta.limit(limite);
  if (cursor) {
    if (cursor.includes("/")) {
      return {ok: false};
    }
    const cursorSnap = await firestore.collection(colecao).doc(cursor).get();
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

export class FirestoreConversaRepository implements ConversaRepository {
  async buscarPorId(id: string): Promise<Conversa | null> {
    if (!id || id.includes("/")) {
      return null;
    }
    const snap = await firestore.collection(CONVERSAS).doc(id).get();
    return snap.exists ? toConversa(snap) : null;
  }

  async enviar(dados: MensagemNova): Promise<Mensagem> {
    const conversaRef = firestore.collection(CONVERSAS).doc(dados.conversaId);
    const mensagemRef = firestore.collection(MENSAGENS).doc();
    await firestore.runTransaction(async (tx) => {
      const conversa = await tx.get(conversaRef);
      const destinatario = dados.participantes.find((uid) => uid !== dados.autorId);
      const resumo = {
        ultimaMensagemTexto: dados.resumo,
        ultimaMensagemEm: FieldValue.serverTimestamp(),
        ultimaMensagemAutorId: dados.autorId,
        // Quem escreve já leu; só o outro fica com a conversa não lida.
        naoLidaPor: destinatario ? [destinatario] : [],
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (conversa.exists) {
        tx.update(conversaRef, resumo);
      } else {
        tx.create(conversaRef, {
          participantes: dados.participantes,
          ...resumo,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      tx.create(mensagemRef, {
        conversaId: dados.conversaId,
        autorId: dados.autorId,
        texto: dados.texto,
        storyId: dados.storyId,
        reacao: dados.reacao,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    return toMensagem(await mensagemRef.get());
  }

  async marcarLida(conversaId: string, uid: string): Promise<void> {
    if (!conversaId || conversaId.includes("/")) {
      return;
    }
    const ref = firestore.collection(CONVERSAS).doc(conversaId);
    const snap = await ref.get();
    if (!snap.exists || !toConversa(snap).naoLidaPor.includes(uid)) {
      return;
    }
    await ref.update({naoLidaPor: FieldValue.arrayRemove(uid)});
  }

  async contarNaoLidas(uid: string): Promise<number> {
    const snap = await firestore
      .collection(CONVERSAS)
      .where("naoLidaPor", "array-contains", uid)
      .count()
      .get();
    return snap.data().count;
  }

  async listarDoUsuario(
    uid: string,
    cursor: string | null,
  ): Promise<PaginaRepo<Conversa>> {
    const consulta = firestore
      .collection(CONVERSAS)
      .where("participantes", "array-contains", uid)
      .orderBy("ultimaMensagemEm", "desc");
    return paginar(
      consulta,
      CONVERSAS,
      cursor,
      (snap) => toConversa(snap).participantes.includes(uid),
      LIMITE_PAGINA_CONVERSAS,
      toConversa,
    );
  }

  async listarMensagens(
    conversaId: string,
    cursor: string | null,
  ): Promise<PaginaRepo<Mensagem>> {
    const consulta = firestore
      .collection(MENSAGENS)
      .where("conversaId", "==", conversaId)
      .orderBy("createdAt", "desc");
    return paginar(
      consulta,
      MENSAGENS,
      cursor,
      (snap) => snap.get("conversaId") === conversaId,
      LIMITE_PAGINA_MENSAGENS,
      toMensagem,
    );
  }

  async limparPorUsuario(uid: string): Promise<void> {
    for (let rodada = 0; rodada < RODADAS_LIMPEZA; rodada += 1) {
      const snap = await firestore
        .collection(CONVERSAS)
        .where("participantes", "array-contains", uid)
        .limit(50)
        .get();
      if (snap.empty) {
        return;
      }
      for (const doc of snap.docs) {
        await this.apagarMensagens(doc.id);
        await doc.ref.delete();
      }
    }
    throw new Error("Falha ao limpar conversas");
  }

  private async apagarMensagens(conversaId: string): Promise<void> {
    for (let rodada = 0; rodada < RODADAS_LIMPEZA; rodada += 1) {
      const snap = await firestore
        .collection(MENSAGENS)
        .where("conversaId", "==", conversaId)
        .limit(LOTE)
        .get();
      if (snap.empty) {
        return;
      }
      const batch = firestore.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      if (snap.size < LOTE) {
        return;
      }
    }
    throw new Error("Falha ao limpar mensagens");
  }
}
