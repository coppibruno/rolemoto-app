import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {
  agregadoCheckinVazio,
  categoriasZeradas,
} from "../../lib/selos";
import type {AgregadoCheckinUsuario, CheckinsPorCategoria} from "../../types/checkin-local";
import type {CategoriaLocal} from "../../types/local";
import {CATEGORIAS_LOCAL} from "../../types/local";
import type {SeloId} from "../../types/selo";
import type {
  TipoMoto,
  Usuario,
  UsuarioCreate,
  UsuarioUpdate,
} from "../../types/usuario";
import type {UsuarioRepository} from "../interfaces/usuario.repository";
import {toIso} from "./mapper";

const COLECAO = "users";
const CHUNK = 100;
const TIPOS_MOTO: TipoMoto[] = ["trail", "speed", "custom"];
const SELOS_VALIDOS: SeloId[] = [
  "primeira_parada",
  "postos_da_estrada",
  "moto_point",
  "cacador_de_vista",
  "parada_de_fome",
  "oficina_confianca",
  "rodou_o_mapa",
];

const emChunks = <T>(itens: T[]): T[][] => {
  const saida: T[][] = [];
  for (let i = 0; i < itens.length; i += CHUNK) {
    saida.push(itens.slice(i, i + CHUNK));
  }
  return saida;
};

const normalizarTipoMoto = (valor: unknown): TipoMoto | null => {
  if (typeof valor !== "string") {
    return null;
  }
  return TIPOS_MOTO.includes(valor as TipoMoto) ? (valor as TipoMoto) : null;
};

const normalizarSelos = (valor: unknown): SeloId[] => {
  if (!Array.isArray(valor)) {
    return [];
  }
  return valor.filter((item): item is SeloId =>
    typeof item === "string" && SELOS_VALIDOS.includes(item as SeloId),
  );
};

const normalizarIds = (valor: unknown): string[] => {
  if (!Array.isArray(valor)) {
    return [];
  }
  return valor.filter((item): item is string =>
    typeof item === "string" && item.length > 0,
  );
};

const normalizarPorCategoria = (valor: unknown): CheckinsPorCategoria => {
  const base = categoriasZeradas();
  if (!valor || typeof valor !== "object") {
    return base;
  }
  const bruto = valor as Record<string, unknown>;
  for (const categoria of CATEGORIAS_LOCAL) {
    const n = bruto[categoria];
    if (typeof n === "number" && Number.isFinite(n) && n >= 0) {
      base[categoria as CategoriaLocal] = Math.floor(n);
    }
  }
  return base;
};

const toAgregado = (data: Record<string, unknown>): AgregadoCheckinUsuario => ({
  locaisVisitadosUnicos: Number(data.locaisVisitadosUnicos ?? 0) || 0,
  locaisVisitadosIds: normalizarIds(data.locaisVisitadosIds),
  checkinsPorCategoria: normalizarPorCategoria(data.checkinsPorCategoria),
  selos: normalizarSelos(data.selos),
});

const toUsuario = (snap: DocumentSnapshot): Usuario => {
  const data = snap.data() ?? {};
  const agregado = toAgregado(data);
  return {
    uid: snap.id,
    nome: String(data.nome ?? ""),
    apelido: String(data.apelido ?? ""),
    moto: String(data.moto ?? ""),
    tipoMoto: normalizarTipoMoto(data.tipoMoto),
    pilotagem: data.pilotagem ?? "tranquila",
    fotoUrl: String(data.fotoUrl ?? ""),
    cidade: String(data.cidade ?? ""),
    garupaFrequente: Boolean(data.garupaFrequente),
    admin: Boolean(data.admin),
    locaisVisitadosUnicos: agregado.locaisVisitadosUnicos,
    selos: agregado.selos,
    createdAt: toIso(data.createdAt),
  };
};

export class FirestoreUsuarioRepository implements UsuarioRepository {
  async buscarPorId(uid: string): Promise<Usuario | null> {
    const snap = await firestore.collection(COLECAO).doc(uid).get();
    if (!snap.exists) {
      return null;
    }
    return toUsuario(snap);
  }

  async buscarPorIds(uids: string[]): Promise<Usuario[]> {
    const unicos = [...new Set(uids)].filter(Boolean);
    if (unicos.length === 0) {
      return [];
    }

    const encontrados: Usuario[] = [];
    for (const chunk of emChunks(unicos)) {
      const refs = chunk.map((uid) => firestore.collection(COLECAO).doc(uid));
      const snaps = await firestore.getAll(...refs);
      for (const snap of snaps) {
        if (snap.exists) {
          encontrados.push(toUsuario(snap));
        }
      }
    }
    return encontrados;
  }

  async buscarPorApelido(apelido: string): Promise<Usuario[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("apelido", "==", apelido)
      .limit(2)
      .get();
    return snap.docs.map((doc) => toUsuario(doc));
  }

  async buscarAgregadoCheckin(
    uid: string,
  ): Promise<AgregadoCheckinUsuario | null> {
    const snap = await firestore.collection(COLECAO).doc(uid).get();
    if (!snap.exists) {
      return null;
    }
    return toAgregado(snap.data() ?? {});
  }

  async salvarAgregadoCheckin(
    uid: string,
    dados: AgregadoCheckinUsuario,
  ): Promise<void> {
    const ref = firestore.collection(COLECAO).doc(uid);
    await ref.set(
      {
        locaisVisitadosUnicos: dados.locaisVisitadosUnicos,
        locaisVisitadosIds: dados.locaisVisitadosIds,
        checkinsPorCategoria: dados.checkinsPorCategoria,
        selos: dados.selos,
      },
      {merge: true},
    );
  }

  async criar(uid: string, dados: UsuarioCreate): Promise<Usuario> {
    const vazio = agregadoCheckinVazio();
    const ref = firestore.collection(COLECAO).doc(uid);
    await ref.set({
      ...dados,
      ...vazio,
      createdAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(uid);
    return criado as Usuario;
  }

  async atualizar(
    uid: string,
    dados: UsuarioUpdate,
  ): Promise<Usuario | null> {
    const ref = firestore.collection(COLECAO).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update({...dados});
    return this.buscarPorId(uid);
  }

  async remover(uid: string): Promise<boolean> {
    const ref = firestore.collection(COLECAO).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return false;
    }
    await ref.delete();
    return true;
  }
}
