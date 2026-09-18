import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {
  arredondarNotaMedia,
  idFeedbackAlvo,
  LIMITE_LISTA_AVALIACOES,
} from "../../lib/avaliacao-experiencia";
import {firestore} from "../../lib/firebase-admin";
import type {
  AvaliacaoExperienciaCreate,
  UsuarioLocalFeedbackDoc,
} from "../../types/avaliacao-experiencia";
import type {UsuarioLocalFeedbackRepository} from "../interfaces/usuario-local-feedback.repository";
import {toIso} from "./mapper";

const COLECAO = "userslocalfeedback";
const COLECAO_LOCAIS = "locais";
const CHUNK = 100;

const emChunks = <T>(itens: T[]): T[][] => {
  const saida: T[][] = [];
  for (let i = 0; i < itens.length; i += CHUNK) {
    saida.push(itens.slice(i, i + CHUNK));
  }
  return saida;
};

const paraFotos = (valor: unknown): string[] => {
  if (!Array.isArray(valor)) {
    return [];
  }
  return valor
    .filter((item): item is string => typeof item === "string" && Boolean(item))
    .map((item) => item.trim())
    .filter(Boolean);
};

const toDoc = (snap: DocumentSnapshot): UsuarioLocalFeedbackDoc => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    localId: String(data.localId ?? ""),
    nota: Number(data.nota ?? 0),
    comentario: String(data.comentario ?? ""),
    fotosUrls: paraFotos(data.fotosUrls),
    recomendaComboio: Boolean(data.recomendaComboio),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreUsuarioLocalFeedbackRepository
implements UsuarioLocalFeedbackRepository {
  async buscarPorId(id: string): Promise<UsuarioLocalFeedbackDoc | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toDoc(snap);
  }

  async buscarPorUsuarioELocal(
    usuarioId: string,
    localId: string,
  ): Promise<UsuarioLocalFeedbackDoc | null> {
    return this.buscarPorId(idFeedbackAlvo(usuarioId, localId));
  }

  async buscarPorIds(ids: string[]): Promise<UsuarioLocalFeedbackDoc[]> {
    const unicos = [...new Set(ids)].filter(Boolean);
    if (unicos.length === 0) {
      return [];
    }

    const encontrados: UsuarioLocalFeedbackDoc[] = [];
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

  async listarPorLocal(
    localId: string,
    limite = LIMITE_LISTA_AVALIACOES,
  ): Promise<UsuarioLocalFeedbackDoc[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("localId", "==", localId)
      .orderBy("createdAt", "desc")
      .limit(limite)
      .get();
    return snap.docs.map(toDoc);
  }

  async criar(
    dados: AvaliacaoExperienciaCreate,
  ): Promise<UsuarioLocalFeedbackDoc | "conflito"> {
    const id = idFeedbackAlvo(dados.usuarioId, dados.alvoId);
    const feedbackRef = firestore.collection(COLECAO).doc(id);
    const localRef = firestore.collection(COLECAO_LOCAIS).doc(dados.alvoId);

    try {
      await firestore.runTransaction(async (tx) => {
        const existente = await tx.get(feedbackRef);
        if (existente.exists) {
          throw new Error("CONFLITO");
        }

        const localSnap = await tx.get(localRef);
        if (!localSnap.exists) {
          throw new Error("ALVO_AUSENTE");
        }

        const data = localSnap.data() ?? {};
        const totalAnterior = Number(data.totalAvaliacoes ?? 0);
        const somaAnterior = Number(data.somaNotas ?? 0);
        const recsAnterior = Number(data.recomendacoesComboio ?? 0);
        const total = totalAnterior + 1;
        const soma = somaAnterior + dados.nota;
        const recs = recsAnterior + (dados.recomendaComboio ? 1 : 0);

        tx.set(feedbackRef, {
          usuarioId: dados.usuarioId,
          localId: dados.alvoId,
          nota: dados.nota,
          comentario: dados.comentario,
          fotosUrls: dados.fotosUrls,
          recomendaComboio: dados.recomendaComboio,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        tx.update(localRef, {
          totalAvaliacoes: total,
          somaNotas: soma,
          recomendacoesComboio: recs,
          notaMedia: arredondarNotaMedia(soma, total),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (erro) {
      if (erro instanceof Error && erro.message === "CONFLITO") {
        return "conflito";
      }
      throw erro;
    }

    const criado = await this.buscarPorId(id);
    return criado as UsuarioLocalFeedbackDoc;
  }
}
