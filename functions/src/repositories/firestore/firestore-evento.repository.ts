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

const toEvento = (snap: DocumentSnapshot): Evento => {
  const data = snap.data() ?? {};
  const atracoesBrutas = Array.isArray(data.atracoes) ? data.atracoes : [];
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
}
