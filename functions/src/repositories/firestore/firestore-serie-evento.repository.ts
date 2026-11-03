import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {AtracaoEvento} from "../../types/evento";
import type {
  SerieEvento,
  SerieEventoCreate,
  StatusSerieEvento,
} from "../../types/serie-evento";
import type {SerieEventoRepository} from "../interfaces/serie-evento.repository";
import {toIso} from "./mapper";

const COLECAO = "seriesEvento";
const TAMANHO_CHUNK = 100;

const emChunks = <T>(itens: T[]): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < itens.length; i += TAMANHO_CHUNK) {
    chunks.push(itens.slice(i, i + TAMANHO_CHUNK));
  }
  return chunks;
};

const textos = (valor: unknown): string[] => {
  if (!Array.isArray(valor)) {
    return [];
  }
  return valor.filter((item): item is string => typeof item === "string");
};

const toSerie = (snap: DocumentSnapshot): SerieEvento => {
  const data = snap.data() ?? {};
  const dia = Number(data.diaSemana);
  return {
    id: snap.id,
    titulo: String(data.titulo ?? ""),
    tipo: data.tipo ?? "moto_point",
    local: {
      lat: data.local?.lat ?? 0,
      lng: data.local?.lng ?? 0,
      endereco: String(data.local?.endereco ?? ""),
      nome: String(data.local?.nome ?? ""),
    },
    localId: typeof data.localId === "string" && data.localId ? data.localId : null,
    diaSemana: Number.isInteger(dia) && dia >= 0 && dia <= 6 ? dia : 0,
    horaAbertura: String(data.horaAbertura ?? ""),
    horaEncerramento: String(data.horaEncerramento ?? ""),
    aPartirDe: typeof data.aPartirDe === "string" && data.aPartirDe ? data.aPartirDe : null,
    acesso: data.acesso === "ingresso" ? "ingresso" : "gratis",
    linkIngresso:
      data.acesso === "ingresso" &&
      typeof data.linkIngresso === "string" &&
      data.linkIngresso.trim() ?
        String(data.linkIngresso) :
        null,
    atracoes: textos(data.atracoes) as AtracaoEvento[],
    fotoCapaUrl: String(data.fotoCapaUrl ?? ""),
    informacoes: String(data.informacoes ?? ""),
    excecoes: textos(data.excecoes),
    status: data.status === "pausada" || data.status === "encerrada" ? data.status : "ativa",
    criadorId: String(data.criadorId ?? ""),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

const corpo = (dados: Omit<SerieEventoCreate, "criadorId">) => ({
  titulo: dados.titulo,
  tipo: dados.tipo,
  local: dados.local,
  localId: dados.localId,
  diaSemana: dados.diaSemana,
  horaAbertura: dados.horaAbertura,
  horaEncerramento: dados.horaEncerramento,
  aPartirDe: dados.aPartirDe,
  acesso: dados.acesso,
  linkIngresso: dados.linkIngresso,
  atracoes: dados.atracoes,
  fotoCapaUrl: dados.fotoCapaUrl,
  informacoes: dados.informacoes,
  updatedAt: FieldValue.serverTimestamp(),
});

export class FirestoreSerieEventoRepository implements SerieEventoRepository {
  async criar(dados: SerieEventoCreate): Promise<SerieEvento> {
    const ref = firestore.collection(COLECAO).doc();
    await ref.set({
      ...corpo(dados),
      criadorId: dados.criadorId,
      excecoes: [],
      status: "ativa",
      createdAt: FieldValue.serverTimestamp(),
    });
    const criada = await this.buscarPorId(ref.id);
    return criada as SerieEvento;
  }

  async buscarPorId(id: string): Promise<SerieEvento | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toSerie(snap);
  }

  async buscarPorIds(ids: string[]): Promise<SerieEvento[]> {
    const unicos = [...new Set(ids)].filter(Boolean);
    if (unicos.length === 0) {
      return [];
    }
    const encontradas: SerieEvento[] = [];
    for (const chunk of emChunks(unicos)) {
      const refs = chunk.map((id) => firestore.collection(COLECAO).doc(id));
      const snaps = await firestore.getAll(...refs);
      for (const snap of snaps) {
        if (snap.exists) {
          encontradas.push(toSerie(snap));
        }
      }
    }
    return encontradas;
  }

  async listar(limite: number): Promise<SerieEvento[]> {
    const snap = await firestore
      .collection(COLECAO)
      .orderBy("updatedAt", "desc")
      .limit(limite)
      .get();
    return snap.docs.map(toSerie);
  }

  async listarPorStatus(
    status: StatusSerieEvento,
    limite: number,
  ): Promise<SerieEvento[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("status", "==", status)
      .limit(limite)
      .get();
    return snap.docs.map(toSerie);
  }

  async atualizar(
    id: string,
    dados: Omit<SerieEventoCreate, "criadorId">,
  ): Promise<SerieEvento | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update(corpo(dados));
    return this.buscarPorId(id);
  }

  async definirStatus(
    id: string,
    status: StatusSerieEvento,
  ): Promise<SerieEvento | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update({status, updatedAt: FieldValue.serverTimestamp()});
    return this.buscarPorId(id);
  }

  async definirExcecoes(
    id: string,
    excecoes: string[],
  ): Promise<SerieEvento | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update({excecoes, updatedAt: FieldValue.serverTimestamp()});
    return this.buscarPorId(id);
  }
}
