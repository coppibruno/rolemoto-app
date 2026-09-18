import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  DiaSemana,
  FacilidadeLocal,
  HorarioDiaLocal,
  Local,
  LocalCreate,
} from "../../types/local";
import {DIAS_SEMANA} from "../../types/local";
import type {LocalRepository} from "../interfaces/local.repository";
import {toIso} from "./mapper";

const COLECAO = "locais";

const toHora = (valor: unknown): string | null =>
  typeof valor === "string" && valor.trim() ? valor.trim() : null;

const toHorarioDia = (valor: unknown): HorarioDiaLocal | null => {
  if (!valor || typeof valor !== "object") {
    return null;
  }
  const o = valor as Record<string, unknown>;
  if (typeof o.dia !== "number" || !(DIAS_SEMANA as number[]).includes(o.dia)) {
    return null;
  }
  const fechado = Boolean(o.fechado);
  return {
    dia: o.dia as DiaSemana,
    fechado,
    abertura: fechado ? null : toHora(o.abertura),
    fechamento: fechado ? null : toHora(o.fechamento),
  };
};

const toHorarios = (data: Record<string, unknown>): HorarioDiaLocal[] => {
  if (Array.isArray(data.horarios) && data.horarios.length > 0) {
    return data.horarios
      .map(toHorarioDia)
      .filter((item): item is HorarioDiaLocal => item !== null);
  }

  const abertura = toHora(data.horaAbertura);
  const fechamento = toHora(data.horaFechamento);
  if (data.aberto24h || !abertura || !fechamento) {
    return [];
  }
  return DIAS_SEMANA.map((dia) => ({
    dia,
    fechado: false,
    abertura,
    fechamento,
  }));
};

const toLocal = (snap: DocumentSnapshot): Local => {
  const data = snap.data() ?? {};
  const facilidadesBrutas = Array.isArray(data.facilidades) ?
    data.facilidades :
    [];
  return {
    id: snap.id,
    nome: String(data.nome ?? ""),
    endereco: String(data.endereco ?? ""),
    lat: Number(data.lat ?? 0),
    lng: Number(data.lng ?? 0),
    categoria: data.categoria ?? "posto",
    facilidades: facilidadesBrutas.map((item) => String(item)) as FacilidadeLocal[],
    aberto24h: Boolean(data.aberto24h),
    horarios: toHorarios(data),
    linkMaps: String(data.linkMaps ?? ""),
    fotoFachadaUrl: String(data.fotoFachadaUrl ?? ""),
    criadorId: String(data.criadorId ?? ""),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreLocalRepository implements LocalRepository {
  async criar(dados: LocalCreate): Promise<Local> {
    const ref = await firestore.collection(COLECAO).add({
      nome: dados.nome,
      endereco: dados.endereco,
      lat: dados.lat,
      lng: dados.lng,
      categoria: dados.categoria,
      facilidades: dados.facilidades,
      aberto24h: dados.aberto24h,
      horarios: dados.horarios,
      linkMaps: dados.linkMaps,
      fotoFachadaUrl: dados.fotoFachadaUrl,
      criadorId: dados.criadorId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(ref.id);
    return criado as Local;
  }

  async listar(): Promise<Local[]> {
    const snap = await firestore
      .collection(COLECAO)
      .orderBy("nome", "asc")
      .get();
    return snap.docs.map(toLocal);
  }

  async buscarPorId(id: string): Promise<Local | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toLocal(snap);
  }
}
