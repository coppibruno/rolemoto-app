import type {DocumentSnapshot, Query} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {tipoNaInbox} from "../../lib/notificacao-inbox";
import type {
  NotificacaoInbox,
  NotificacaoInboxCreate,
  PaginaNotificacoes,
} from "../../types/notificacao-inbox";
import {LIMITE_PAGINA_NOTIFICACOES} from "../../types/notificacao-inbox";
import type {NotificacaoInboxRepository} from "../interfaces/notificacao-inbox.repository";
import {toIso} from "./mapper";

const COLECAO = "usersnotificacao";
const LOTE = 100;
const RODADAS = 50;
const TETO_CONTAGEM = 100;

const idValido = (id: string): boolean => Boolean(id) && !id.includes("/");

const toNotificacao = (snap: DocumentSnapshot): NotificacaoInbox | null => {
  const data = snap.data() ?? {};
  const tipo = tipoNaInbox(String(data.tipo ?? ""));
  if (!tipo) {
    return null;
  }
  const atorBruto = data.atorUid;
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    tipo,
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    url: String(data.url ?? ""),
    lida: data.lida === true,
    atorUid: typeof atorBruto === "string" && atorBruto ? atorBruto : null,
    roleId: String(data.roleId ?? ""),
    localId: String(data.localId ?? ""),
    eventoId: String(data.eventoId ?? ""),
    createdAt: toIso(data.createdAt),
  };
};

export class FirestoreNotificacaoInboxRepository implements NotificacaoInboxRepository {
  async criar(dados: NotificacaoInboxCreate): Promise<NotificacaoInbox> {
    const ref = firestore.collection(COLECAO).doc();
    await ref.set({
      usuarioId: dados.usuarioId,
      tipo: dados.tipo,
      title: dados.title,
      body: dados.body,
      url: dados.url,
      lida: false,
      atorUid: dados.atorUid,
      roleId: dados.roleId,
      localId: dados.localId,
      eventoId: dados.eventoId,
      createdAt: FieldValue.serverTimestamp(),
    });
    const snap = await ref.get();
    return toNotificacao(snap) as NotificacaoInbox;
  }

  async listarDoUsuario(
    usuarioId: string,
    cursor: string | null,
  ): Promise<PaginaNotificacoes> {
    let cursorSnap: DocumentSnapshot | null = null;
    if (cursor) {
      if (!idValido(cursor)) {
        return {ok: false};
      }
      cursorSnap = await firestore.collection(COLECAO).doc(cursor).get();
      if (!cursorSnap.exists || cursorSnap.get("usuarioId") !== usuarioId) {
        return {ok: false};
      }
    }

    let consulta: Query = firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .orderBy("createdAt", "desc")
      .limit(LIMITE_PAGINA_NOTIFICACOES);

    if (cursorSnap) {
      consulta = consulta.startAfter(cursorSnap);
    }

    const snap = await consulta.get();
    const itens = snap.docs
      .map((doc) => toNotificacao(doc))
      .filter((item): item is NotificacaoInbox => item !== null);
    const ultimo = snap.docs[snap.docs.length - 1];
    return {
      ok: true,
      itens,
      proximoCursor:
        snap.size === LIMITE_PAGINA_NOTIFICACOES && ultimo ? ultimo.id : null,
    };
  }

  async contarNaoLidas(usuarioId: string): Promise<number> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .where("lida", "==", false)
      .limit(TETO_CONTAGEM)
      .get();
    return snap.size;
  }

  async marcarLida(id: string, usuarioId: string): Promise<NotificacaoInbox | null> {
    if (!idValido(id)) {
      return null;
    }
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.get("usuarioId") !== usuarioId) {
      return null;
    }
    if (snap.get("lida") !== true) {
      await ref.update({lida: true});
    }
    return toNotificacao(await ref.get());
  }

  async marcarTodasLidas(usuarioId: string): Promise<number> {
    let total = 0;
    for (let rodada = 0; rodada < RODADAS; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO)
        .where("usuarioId", "==", usuarioId)
        .where("lida", "==", false)
        .limit(LOTE)
        .get();
      if (snap.empty) {
        return total;
      }
      const lote = firestore.batch();
      snap.docs.forEach((doc) => lote.update(doc.ref, {lida: true}));
      await lote.commit();
      total += snap.size;
      if (snap.size < LOTE) {
        return total;
      }
    }
    return total;
  }

  async limparPorUsuario(usuarioId: string): Promise<void> {
    for (let rodada = 0; rodada < RODADAS; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO)
        .where("usuarioId", "==", usuarioId)
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
