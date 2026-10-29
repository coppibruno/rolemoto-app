import {FieldValue, type DocumentSnapshot} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {
  SugestaoJaDecididaError,
  SugestaoNaoEncontradaError,
} from "../../lib/sugestoes-local/erros";
import type {DiaSemana, HorarioDiaLocal, Local, LocalCreate} from "../../types/local";
import {CATEGORIAS_LOCAL, DIAS_SEMANA} from "../../types/local";
import type {
  FotoSugestaoGravada,
  StatusSugestaoLocal,
  SugestaoLocal,
  SugestaoLocalNova,
} from "../../types/sugestao-local";
import type {SugestaoLocalRepository} from "../interfaces/sugestao-local.repository";
import {camposNovoLocal, toLocal} from "./firestore-local.repository";
import {toIso} from "./mapper";

const COLECAO = "sugestoesLocal";
const CONFIG = "config";
const DOC_CONFIG = "sugestoesLocal";
const LOCAIS = "locais";

const STATUSES: StatusSugestaoLocal[] = ["pendente", "aprovada", "recusada"];

const jaExiste = (error: unknown): boolean => {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }
  const code = (error as {code: unknown}).code;
  return code === 6 || code === "already-exists";
};

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

const toHorarios = (valor: unknown): HorarioDiaLocal[] => {
  if (!Array.isArray(valor)) {
    return [];
  }
  return valor
    .map(toHorarioDia)
    .filter((item): item is HorarioDiaLocal => item !== null);
};

const toStatus = (valor: unknown): StatusSugestaoLocal =>
  STATUSES.includes(valor as StatusSugestaoLocal) ?
    (valor as StatusSugestaoLocal) :
    "pendente";

const toCategoria = (valor: unknown) =>
  (CATEGORIAS_LOCAL as string[]).includes(String(valor)) ?
    (valor as SugestaoLocal["categoriaSugerida"]) :
    "bar_moto_point";

const toSugestao = (snap: DocumentSnapshot): SugestaoLocal => {
  const data = snap.data() ?? {};
  const motivos = Array.isArray(data.motivos) ?
    data.motivos.filter((item): item is string => typeof item === "string").slice(0, 3) :
    [];
  return {
    id: snap.id,
    placeId: String(data.placeId ?? snap.id),
    nome: String(data.nome ?? ""),
    endereco: String(data.endereco ?? ""),
    lat: Number(data.lat ?? 0),
    lng: Number(data.lng ?? 0),
    categoriaSugerida: toCategoria(data.categoriaSugerida),
    nota: Number(data.nota ?? 0),
    motivos,
    sementeId: String(data.sementeId ?? ""),
    sementeNome: String(data.sementeNome ?? ""),
    distanciaSementeKm: Number(data.distanciaSementeKm ?? 0),
    linkMaps: String(data.linkMaps ?? ""),
    aberto24h: Boolean(data.aberto24h),
    horarios: toHorarios(data.horarios),
    horarioCompleto: Boolean(data.horarioCompleto),
    fotoFachadaUrl: String(data.fotoFachadaUrl ?? ""),
    fotoRecurso: String(data.fotoRecurso ?? ""),
    fotoAtribuicao: String(data.fotoAtribuicao ?? ""),
    fotoIndisponivel: Boolean(data.fotoIndisponivel),
    status: toStatus(data.status),
    localId: typeof data.localId === "string" && data.localId ? data.localId : null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreSugestaoLocalRepository implements SugestaoLocalRepository {
  async listarPorStatus(status: StatusSugestaoLocal): Promise<SugestaoLocal[]> {
    const snap = await firestore.collection(COLECAO).where("status", "==", status).get();
    return snap.docs
      .map(toSugestao)
      .sort((a, b) => b.nota - a.nota);
  }

  async listarIds(): Promise<string[]> {
    const snap = await firestore.collection(COLECAO).select("status").get();
    return snap.docs.map((doc) => doc.id);
  }

  async buscarPorId(id: string): Promise<SugestaoLocal | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toSugestao(snap);
  }

  async criar(dados: SugestaoLocalNova): Promise<boolean> {
    try {
      await firestore.collection(COLECAO).doc(dados.id).create({
        placeId: dados.placeId,
        nome: dados.nome,
        endereco: dados.endereco,
        lat: dados.lat,
        lng: dados.lng,
        categoriaSugerida: dados.categoriaSugerida,
        nota: dados.nota,
        motivos: dados.motivos.slice(0, 3),
        sementeId: dados.sementeId,
        sementeNome: dados.sementeNome,
        distanciaSementeKm: dados.distanciaSementeKm,
        linkMaps: dados.linkMaps,
        aberto24h: dados.aberto24h,
        horarios: dados.horarios,
        horarioCompleto: dados.horarioCompleto,
        fotoFachadaUrl: dados.fotoFachadaUrl,
        fotoRecurso: dados.fotoRecurso,
        fotoAtribuicao: dados.fotoAtribuicao,
        fotoIndisponivel: dados.fotoIndisponivel,
        status: "pendente",
        localId: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    } catch (error) {
      if (jaExiste(error)) {
        return false;
      }
      throw error;
    }
  }

  async gravarFoto(id: string, foto: FotoSugestaoGravada): Promise<void> {
    const ref = firestore.collection(COLECAO).doc(id);
    await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists || String(snap.get("status") ?? "") !== "pendente") {
        return;
      }
      if (String(snap.get("fotoFachadaUrl") ?? "") && foto.fotoFachadaUrl) {
        return;
      }
      tx.update(ref, {
        ...foto,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  async aprovar(id: string, dados: LocalCreate): Promise<Local> {
    const sugRef = firestore.collection(COLECAO).doc(id);
    const localRef = firestore.collection(LOCAIS).doc();
    await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(sugRef);
      if (!snap.exists) {
        throw new SugestaoNaoEncontradaError();
      }
      if (String(snap.get("status") ?? "") !== "pendente") {
        throw new SugestaoJaDecididaError();
      }
      tx.set(localRef, camposNovoLocal({...dados, googlePlaceId: id}));
      tx.update(sugRef, {
        status: "aprovada",
        localId: localRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    const criado = await firestore.collection(LOCAIS).doc(localRef.id).get();
    if (!criado.exists) {
      throw new Error("Local aprovado não encontrado");
    }
    return toLocal(criado);
  }

  async recusar(id: string): Promise<void> {
    const ref = firestore.collection(COLECAO).doc(id);
    await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new SugestaoNaoEncontradaError();
      }
      if (String(snap.get("status") ?? "") !== "pendente") {
        throw new SugestaoJaDecididaError();
      }
      tx.update(ref, {
        status: "recusada",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  async lerProximoIndice(): Promise<number> {
    const snap = await firestore.collection(CONFIG).doc(DOC_CONFIG).get();
    const valor = snap.get("proximoIndice");
    if (typeof valor === "number" && Number.isInteger(valor) && valor >= 0) {
      return valor;
    }
    return 0;
  }

  async gravarProximoIndice(indice: number): Promise<void> {
    await firestore.collection(CONFIG).doc(DOC_CONFIG).set(
      {proximoIndice: indice, updatedAt: FieldValue.serverTimestamp()},
      {merge: true},
    );
  }
}
