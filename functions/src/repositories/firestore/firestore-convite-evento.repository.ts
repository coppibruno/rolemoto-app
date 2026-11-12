import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {LIMITE_UID_CONVITE} from "../../lib/convite-evento";
import type {SituacaoConvites} from "../../types/convite-evento";
import type {ConviteEventoRepository} from "../interfaces/convite-evento.repository";
import {apagarPorCampo} from "./apagar-por-campo";

const COLECAO = "usersconviteevento";
const INSCRICOES = "usersevento";
const LOTE = 100;
const RODADAS = 50;

const idConvite = (
  convidanteId: string,
  convidadoId: string,
  eventoId: string,
): string => `${convidanteId}_${convidadoId}_${eventoId}`;

const idInscricao = (usuarioId: string, eventoId: string): string =>
  `${usuarioId}_${eventoId}`;

const consultaveis = (uids: string[]): string[] =>
  uids.filter((uid) => uid.length > 0 && uid.length <= LIMITE_UID_CONVITE);

const fatias = (uids: string[]): string[][] => {
  const grupos: string[][] = [];
  for (let i = 0; i < uids.length; i += LOTE) {
    grupos.push(uids.slice(i, i + LOTE));
  }
  return grupos;
};

export class FirestoreConviteEventoRepository
implements ConviteEventoRepository {
  async presentes(
    convidanteId: string,
    eventoId: string,
    uids: string[],
  ): Promise<SituacaoConvites> {
    const pedidos = consultaveis(uids);
    const inscritos: string[] = [];
    const convidados: string[] = [];
    for (const grupo of fatias(pedidos)) {
      const refsInscricao = grupo.map((uid) =>
        firestore.collection(INSCRICOES).doc(idInscricao(uid, eventoId)),
      );
      const refsConvite = grupo.map((uid) =>
        firestore.collection(COLECAO).doc(
          idConvite(convidanteId, uid, eventoId),
        ),
      );
      const [snapsInscricao, snapsConvite] = await Promise.all([
        firestore.getAll(...refsInscricao),
        firestore.getAll(...refsConvite),
      ]);
      snapsInscricao.forEach((snap, indice) => {
        const uid = grupo[indice];
        if (snap.exists && uid) {
          inscritos.push(uid);
        }
      });
      snapsConvite.forEach((snap, indice) => {
        const uid = grupo[indice];
        if (snap.exists && uid) {
          convidados.push(uid);
        }
      });
    }
    return {inscritos, convidados};
  }

  async criar(
    convidanteId: string,
    eventoId: string,
    convidadoIds: string[],
  ): Promise<string[]> {
    const ids = consultaveis(convidadoIds).filter((uid) => uid !== convidanteId);
    if (ids.length === 0) {
      return [];
    }
    const refs = ids.map((convidadoId) =>
      firestore.collection(COLECAO).doc(
        idConvite(convidanteId, convidadoId, eventoId),
      ),
    );
    return firestore.runTransaction(async (tx) => {
      const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));
      const criados: string[] = [];
      snaps.forEach((snap, indice) => {
        const convidadoId = ids[indice];
        const ref = refs[indice];
        if (!convidadoId || !ref || snap.exists) {
          return;
        }
        tx.set(ref, {
          id: ref.id,
          convidanteId,
          convidadoId,
          eventoId,
          createdAt: FieldValue.serverTimestamp(),
        });
        criados.push(convidadoId);
      });
      return criados;
    });
  }

  async removerPorEvento(eventoId: string): Promise<number> {
    return apagarPorCampo(COLECAO, "eventoId", eventoId);
  }

  async limparPorUsuario(uid: string): Promise<void> {
    const erros: unknown[] = [];
    try {
      await this.apagarPorCampo("convidanteId", uid);
    } catch (error) {
      erros.push(error);
    }
    try {
      await this.apagarPorCampo("convidadoId", uid);
    } catch (error) {
      erros.push(error);
    }
    const falha = erros[0];
    if (falha instanceof Error) {
      throw falha;
    }
    if (falha) {
      throw new Error("Falha ao limpar convites de evento");
    }
  }

  private async apagarPorCampo(
    campo: "convidanteId" | "convidadoId",
    uid: string,
  ): Promise<void> {
    const vistos = new Set<string>();
    for (let rodada = 0; rodada < RODADAS; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO)
        .where(campo, "==", uid)
        .limit(LOTE)
        .get();
      const novos = snap.docs.filter((doc) => !vistos.has(doc.id));
      if (novos.length === 0) {
        return;
      }
      const batch = firestore.batch();
      for (const doc of novos) {
        vistos.add(doc.id);
        batch.delete(doc.ref);
      }
      await batch.commit();
      if (snap.size < LOTE) {
        return;
      }
    }
  }
}
