import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {AtracaoEvento, Evento, EventoCreate} from "../../types/evento";
import type {
  EventoRepository,
  FiltroListagemEventos,
} from "../interfaces/evento.repository";
import {toIso, toIsoOrNull, toTimestamp} from "./mapper";

const COLECAO = "eventos";
const LIMITE_LISTAGEM = 200;
const TAMANHO_CHUNK = 100;

const emChunks = <T>(itens: T[]): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < itens.length; i += TAMANHO_CHUNK) {
    chunks.push(itens.slice(i, i + TAMANHO_CHUNK));
  }
  return chunks;
};

const toEvento = (snap: DocumentSnapshot): Evento => {
  const data = snap.data() ?? {};
  const atracoesBrutas = Array.isArray(data.atracoes) ? data.atracoes : [];
  const totalAvaliacoes = Number(data.totalAvaliacoes ?? 0);
  return {
    id: snap.id,
    titulo: String(data.titulo ?? ""),
    tipo: data.tipo ?? "moto_point_semanal",
    local: {
      lat: data.local?.lat ?? 0,
      lng: data.local?.lng ?? 0,
      endereco: String(data.local?.endereco ?? ""),
      nome: String(data.local?.nome ?? ""),
    },
    dataHoraAbertura: toIso(data.dataHoraAbertura),
    dataHoraEncerramento: toIsoOrNull(data.dataHoraEncerramento),
    acesso: data.acesso === "ingresso" ? "ingresso" : "gratis",
    linkIngresso:
      data.acesso === "ingresso" &&
      typeof data.linkIngresso === "string" &&
      data.linkIngresso.trim() ?
        String(data.linkIngresso) :
        null,
    atracoes: atracoesBrutas.map((item) => String(item)) as AtracaoEvento[],
    fotoCapaUrl: String(data.fotoCapaUrl ?? ""),
    informacoes: String(data.informacoes ?? ""),
    criadorId: String(data.criadorId ?? ""),
    notaMedia: totalAvaliacoes > 0 ? Number(data.notaMedia ?? 0) : 0,
    totalAvaliacoes,
    recomendacoesComboio: Number(data.recomendacoesComboio ?? 0),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreEventoRepository implements EventoRepository {
  async criar(dados: EventoCreate): Promise<Evento> {
    const ref = await firestore.collection(COLECAO).add({
      titulo: dados.titulo,
      tipo: dados.tipo,
      local: dados.local,
      dataHoraAbertura: toTimestamp(dados.dataHoraAbertura),
      dataHoraEncerramento: dados.dataHoraEncerramento ?
        toTimestamp(dados.dataHoraEncerramento) :
        null,
      acesso: dados.acesso,
      linkIngresso: dados.linkIngresso,
      atracoes: dados.atracoes,
      fotoCapaUrl: dados.fotoCapaUrl,
      informacoes: dados.informacoes,
      criadorId: dados.criadorId,
      notaMedia: 0,
      totalAvaliacoes: 0,
      recomendacoesComboio: 0,
      somaNotas: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(ref.id);
    return criado as Evento;
  }

  async listarFuturos(filtros?: FiltroListagemEventos): Promise<Evento[]> {
    const inicio = filtros?.dataInicioIso ?
      toTimestamp(filtros.dataInicioIso) :
      Timestamp.now();

    let query = firestore
      .collection(COLECAO)
      .where("dataHoraAbertura", ">=", inicio)
      .orderBy("dataHoraAbertura", "asc");

    if (filtros?.dataFimIso) {
      query = query.where(
        "dataHoraAbertura",
        "<=",
        toTimestamp(filtros.dataFimIso),
      );
    }

    const snap = await query.limit(LIMITE_LISTAGEM).get();
    return snap.docs.map(toEvento);
  }

  async buscarPorId(id: string): Promise<Evento | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toEvento(snap);
  }

  async buscarPorIds(ids: string[]): Promise<Evento[]> {
    const unicos = [...new Set(ids)].filter(Boolean);
    if (unicos.length === 0) {
      return [];
    }

    const encontrados: Evento[] = [];
    for (const chunk of emChunks(unicos)) {
      const refs = chunk.map((id) => firestore.collection(COLECAO).doc(id));
      const snaps = await firestore.getAll(...refs);
      for (const snap of snaps) {
        if (snap.exists) {
          encontrados.push(toEvento(snap));
        }
      }
    }
    return encontrados;
  }
}
