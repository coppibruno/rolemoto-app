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
  UsuarioEventoFeedbackDoc,
} from "../../types/avaliacao-experiencia";
import type {UsuarioEventoFeedbackRepository} from "../interfaces/usuario-evento-feedback.repository";
import {toIso} from "./mapper";

const COLECAO = "userseventofeedback";
const COLECAO_EVENTOS = "eventos";
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

const toDoc = (snap: DocumentSnapshot): UsuarioEventoFeedbackDoc => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    eventoId: String(data.eventoId ?? ""),
    nota: Number(data.nota ?? 0),
    comentario: String(data.comentario ?? ""),
    fotosUrls: paraFotos(data.fotosUrls),
    recomendaComboio: Boolean(data.recomendaComboio),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreUsuarioEventoFeedbackRepository
implements UsuarioEventoFeedbackRepository {
  async buscarPorId(id: string): Promise<UsuarioEventoFeedbackDoc | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toDoc(snap);
  }

  async buscarPorUsuarioEEvento(
    usuarioId: string,
    eventoId: string,
  ): Promise<UsuarioEventoFeedbackDoc | null> {
    return this.buscarPorId(idFeedbackAlvo(usuarioId, eventoId));
  }

  async buscarPorIds(ids: string[]): Promise<UsuarioEventoFeedbackDoc[]> {
    const unicos = [...new Set(ids)].filter(Boolean);
    if (unicos.length === 0) {
      return [];
    }

    const encontrados: UsuarioEventoFeedbackDoc[] = [];
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

  async listarPorEvento(
    eventoId: string,
    limite = LIMITE_LISTA_AVALIACOES,
  ): Promise<UsuarioEventoFeedbackDoc[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("eventoId", "==", eventoId)
      .orderBy("createdAt", "desc")
      .limit(limite)
      .get();
    return snap.docs.map(toDoc);
  }

  async criar(
    dados: AvaliacaoExperienciaCreate,
  ): Promise<UsuarioEventoFeedbackDoc | "conflito"> {
    const id = idFeedbackAlvo(dados.usuarioId, dados.alvoId);
    const feedbackRef = firestore.collection(COLECAO).doc(id);
    const eventoRef = firestore.collection(COLECAO_EVENTOS).doc(dados.alvoId);

    try {
      await firestore.runTransaction(async (tx) => {
        const existente = await tx.get(feedbackRef);
        if (existente.exists) {
          throw new Error("CONFLITO");
        }

        const eventoSnap = await tx.get(eventoRef);
        if (!eventoSnap.exists) {
          throw new Error("ALVO_AUSENTE");
        }

        const data = eventoSnap.data() ?? {};
        const totalAnterior = Number(data.totalAvaliacoes ?? 0);
        const somaAnterior = Number(data.somaNotas ?? 0);
        const recsAnterior = Number(data.recomendacoesComboio ?? 0);
        const total = totalAnterior + 1;
        const soma = somaAnterior + dados.nota;
        const recs = recsAnterior + (dados.recomendaComboio ? 1 : 0);

        tx.set(feedbackRef, {
          usuarioId: dados.usuarioId,
          eventoId: dados.alvoId,
          nota: dados.nota,
          comentario: dados.comentario,
          fotosUrls: dados.fotosUrls,
          recomendaComboio: dados.recomendaComboio,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        tx.update(eventoRef, {
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
    return criado as UsuarioEventoFeedbackDoc;
  }
}
