import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {randomUUID} from "crypto";
import type {
  AlbumEvento,
  AtracaoEvento,
  Evento,
  EventoCreate,
  EventoPublicacao,
} from "../../types/evento";
import type {
  EventoRepository,
  FiltroListagemEventos,
  ResultadoAdicionarAlbum,
  ResultadoRemoverAlbum,
} from "../interfaces/evento.repository";
import {TETO_ALBUNS_EVENTO, deveNotificarAlbum} from "../../lib/album-evento";
import {toIso, toIsoOrNull, toTimestamp} from "./mapper";
import {reservarYmd} from "./reservar-ymd";

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

const lerAlbuns = (bruto: unknown): AlbumEvento[] => {
  if (!Array.isArray(bruto)) {
    return [];
  }
  const saida: AlbumEvento[] = [];
  for (const item of bruto) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const url = typeof row.url === "string" ? row.url : "";
    const criadoPor = typeof row.criadoPor === "string" ? row.criadoPor : "";
    if (!id || !url) {
      continue;
    }
    saida.push({
      id,
      url,
      createdAt: toIso(row.createdAt),
      criadoPor,
    });
  }
  return saida;
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
    localId: typeof data.localId === "string" && data.localId ?
      data.localId :
      null,
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
    serieId: typeof data.serieId === "string" && data.serieId ? data.serieId : null,
    ocorrenciaYmd:
      typeof data.ocorrenciaYmd === "string" && data.ocorrenciaYmd ?
        data.ocorrenciaYmd :
        null,
    ocorrenciaAjustada: data.ocorrenciaAjustada === true,
    cancelada: data.cancelada === true,
    fotografoId:
      typeof data.fotografoId === "string" && data.fotografoId ?
        data.fotografoId :
        null,
    albuns: lerAlbuns(data.albuns),
    albumNotificado: data.albumNotificado === true,
    notaMedia: totalAvaliacoes > 0 ? Number(data.notaMedia ?? 0) : 0,
    totalAvaliacoes,
    recomendacoesComboio: Number(data.recomendacoesComboio ?? 0),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

const jaExiste = (error: unknown): boolean => {
  const code = (error as {code?: number | string}).code;
  return code === 6 || code === "already-exists" || code === "ALREADY_EXISTS";
};

const documentoNovo = (dados: EventoCreate) => ({
  titulo: dados.titulo,
  tipo: dados.tipo,
  local: dados.local,
  localId: dados.localId,
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
  serieId: dados.serieId,
  ocorrenciaYmd: dados.ocorrenciaYmd,
  ocorrenciaAjustada: dados.ocorrenciaAjustada,
  cancelada: dados.cancelada,
  fotografoId: null,
  albuns: [],
  albumNotificado: false,
  notaMedia: 0,
  totalAvaliacoes: 0,
  recomendacoesComboio: 0,
  somaNotas: 0,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

const camposConteudo = (dados: EventoPublicacao) => ({
  titulo: dados.titulo,
  tipo: dados.tipo,
  local: dados.local,
  localId: dados.localId,
  dataHoraAbertura: toTimestamp(dados.dataHoraAbertura),
  dataHoraEncerramento: dados.dataHoraEncerramento ?
    toTimestamp(dados.dataHoraEncerramento) :
    null,
  acesso: dados.acesso,
  linkIngresso: dados.linkIngresso,
  atracoes: dados.atracoes,
  fotoCapaUrl: dados.fotoCapaUrl,
  informacoes: dados.informacoes,
  serieId: dados.serieId,
  ocorrenciaYmd: dados.ocorrenciaYmd,
  ocorrenciaAjustada: dados.ocorrenciaAjustada,
  cancelada: dados.cancelada,
  updatedAt: FieldValue.serverTimestamp(),
});

export class FirestoreEventoRepository implements EventoRepository {
  async criar(dados: EventoCreate): Promise<Evento> {
    const ref = await firestore.collection(COLECAO).add(documentoNovo(dados));
    const criado = await this.buscarPorId(ref.id);
    return criado as Evento;
  }

  async gravarSeAusente(
    id: string,
    dados: EventoCreate,
  ): Promise<{evento: Evento; criado: boolean}> {
    const ref = firestore.collection(COLECAO).doc(id);
    try {
      await ref.create(documentoNovo(dados));
    } catch (error) {
      if (!jaExiste(error)) {
        throw error;
      }
      const existente = await this.buscarPorId(id);
      if (!existente) {
        throw error;
      }
      return {evento: existente, criado: false};
    }
    const criado = await this.buscarPorId(id);
    return {evento: criado as Evento, criado: true};
  }

  async listarPorSerie(serieId: string): Promise<Evento[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("serieId", "==", serieId)
      .orderBy("dataHoraAbertura", "asc")
      .get();
    return snap.docs.map(toEvento);
  }

  async atualizarOcorrencia(
    id: string,
    dados: EventoPublicacao,
  ): Promise<Evento | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update(camposConteudo(dados));
    return this.buscarPorId(id);
  }

  async marcarCancelada(id: string): Promise<Evento | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update({
      cancelada: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return this.buscarPorId(id);
  }

  async remover(id: string): Promise<void> {
    await firestore.collection(COLECAO).doc(id).delete();
  }

  async listarFuturos(filtros?: FiltroListagemEventos): Promise<Evento[]> {
    const MAX_DURACAO_MS = 7 * 24 * 60 * 60 * 1000;
    const inicioMs = filtros?.dataInicioIso ?
      Date.parse(filtros.dataInicioIso) :
      Date.now();
    const consultaInicio = Timestamp.fromMillis(inicioMs - MAX_DURACAO_MS);

    let query = firestore
      .collection(COLECAO)
      .where("dataHoraAbertura", ">=", consultaInicio)
      .orderBy("dataHoraAbertura", "asc");

    if (filtros?.dataFimIso) {
      query = query.where(
        "dataHoraAbertura",
        "<=",
        toTimestamp(filtros.dataFimIso),
      );
    }

    const snap = await query.limit(LIMITE_LISTAGEM).get();
    return snap.docs
      .map(toEvento)
      .filter((evento) => {
        const fim = Date.parse(
          evento.dataHoraEncerramento ?? evento.dataHoraAbertura,
        );
        return Number.isFinite(fim) && fim >= inicioMs;
      });
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

  async listarPorLocalId(localId: string, limite: number): Promise<Evento[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("localId", "==", localId)
      .orderBy("dataHoraAbertura", "desc")
      .limit(limite)
      .get();
    return snap.docs.map(toEvento);
  }

  async atualizarLocalId(
    id: string,
    localId: string | null,
  ): Promise<Evento | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update({
      localId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return this.buscarPorId(id);
  }

  async desvincularLocal(localId: string): Promise<number> {
    const LOTE = 400;
    let alterados = 0;
    for (let rodada = 0; rodada < 50; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO)
        .where("localId", "==", localId)
        .limit(LOTE)
        .get();
      if (snap.empty) {
        return alterados;
      }
      const batch = firestore.batch();
      snap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          localId: null,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
      alterados += snap.size;
      if (snap.size < LOTE) {
        return alterados;
      }
    }
    return alterados;
  }

  async reservarPushDoDia(id: string, ymd: string): Promise<boolean> {
    return reservarYmd(COLECAO, id, ymd);
  }

  async definirFotografo(
    id: string,
    fotografoId: string | null,
  ): Promise<Evento | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update({
      fotografoId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return this.buscarPorId(id);
  }

  async adicionarAlbum(
    id: string,
    url: string,
    criadoPor: string,
  ): Promise<ResultadoAdicionarAlbum | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        return null;
      }
      const atual = toEvento(snap);
      if (atual.albuns.length >= TETO_ALBUNS_EVENTO) {
        return {tipo: "limite" as const};
      }
      if (atual.albuns.some((item) => item.url === url)) {
        return {tipo: "duplicado" as const};
      }
      const notificou = deveNotificarAlbum(atual.albuns.length, atual.albumNotificado);
      const agora = new Date().toISOString();
      const album: AlbumEvento = {
        id: randomUUID().replace(/-/g, "").slice(0, 16),
        url,
        createdAt: agora,
        criadoPor,
      };
      const albuns = [...atual.albuns, album];
      tx.update(ref, {
        albuns,
        albumNotificado: notificou ? true : atual.albumNotificado,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return {
        tipo: "ok" as const,
        album,
        notificou,
        evento: {
          ...atual,
          albuns,
          albumNotificado: notificou ? true : atual.albumNotificado,
          updatedAt: agora,
        },
      };
    });
  }

  async removerAlbum(
    id: string,
    albumId: string,
  ): Promise<ResultadoRemoverAlbum | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        return null;
      }
      const atual = toEvento(snap);
      if (!atual.albuns.some((item) => item.id === albumId)) {
        return {tipo: "ausente" as const};
      }
      const albuns = atual.albuns.filter((item) => item.id !== albumId);
      const agora = new Date().toISOString();
      tx.update(ref, {
        albuns,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return {
        tipo: "ok" as const,
        zerou: albuns.length === 0,
        evento: {...atual, albuns, updatedAt: agora},
      };
    });
  }
}
