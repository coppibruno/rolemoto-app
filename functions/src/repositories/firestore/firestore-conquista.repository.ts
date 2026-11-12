import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  Conquista,
  ConquistaCreate,
  ConquistaUpdate,
  NovidadeConquista,
  PassagemNova,
  UsuarioConquista,
} from "../../types/conquista";
import type {ConquistaRepository} from "../interfaces/conquista.repository";
import {toIso} from "./mapper";

const COLECAO = "conquistas";
const CARIMBOS = "usersconquista";
const LOTE_LIMPEZA = 300;
const RODADAS_LIMPEZA = 50;
const LOTE_GET_ALL = 100;

const idCarimbo = (usuarioId: string, conquistaId: string): string =>
  `${usuarioId}_${conquistaId}`;

const umaCasa = (n: number): number => Math.round(n * 10) / 10;

const toConquista = (snap: DocumentSnapshot): Conquista => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    nome: String(data.nome ?? ""),
    lat: Number(data.lat ?? 0),
    lng: Number(data.lng ?? 0),
    raioMetros: Number(data.raioMetros ?? 0),
    ativa: data.ativa !== false,
    criadorId: String(data.criadorId ?? ""),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

const toCarimbo = (snap: DocumentSnapshot): UsuarioConquista => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    conquistaId: String(data.conquistaId ?? ""),
    velocidadeMaxKmh: Number(data.velocidadeMaxKmh ?? 0),
    telemetriaId: String(data.telemetriaId ?? ""),
    primeiraVezEm: toIso(data.primeiraVezEm),
    recordeEm: toIso(data.recordeEm),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

const novoDoc = (dados: ConquistaCreate) => ({
  nome: dados.nome,
  lat: dados.lat,
  lng: dados.lng,
  raioMetros: dados.raioMetros,
  ativa: true,
  criadorId: dados.criadorId,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

export class FirestoreConquistaRepository implements ConquistaRepository {
  async listar(): Promise<Conquista[]> {
    const snap = await firestore.collection(COLECAO).get();
    return snap.docs.map(toConquista);
  }

  async buscarPorId(id: string): Promise<Conquista | null> {
    if (!id) return null;
    const snap = await firestore.collection(COLECAO).doc(id).get();
    return snap.exists ? toConquista(snap) : null;
  }

  async criar(dados: ConquistaCreate): Promise<Conquista> {
    const ref = await firestore.collection(COLECAO).add(novoDoc(dados));
    return toConquista(await ref.get());
  }

  async criarSeAusente(id: string, dados: ConquistaCreate): Promise<boolean> {
    const ref = firestore.collection(COLECAO).doc(id);
    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) return false;
      tx.set(ref, novoDoc(dados));
      return true;
    });
  }

  async atualizar(id: string, dados: ConquistaUpdate): Promise<Conquista | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const campos: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    for (const [chave, valor] of Object.entries(dados)) {
      if (valor !== undefined) campos[chave] = valor;
    }
    await ref.update(campos);
    return toConquista(await ref.get());
  }

  async registrarPassagem(
    passagem: PassagemNova,
  ): Promise<NovidadeConquista | null> {
    const ref = firestore
      .collection(CARIMBOS)
      .doc(idCarimbo(passagem.usuarioId, passagem.conquistaId));
    const velocidade = umaCasa(passagem.velocidadeMaxKmh);

    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const agora = FieldValue.serverTimestamp();
      if (!snap.exists) {
        tx.set(ref, {
          usuarioId: passagem.usuarioId,
          conquistaId: passagem.conquistaId,
          velocidadeMaxKmh: velocidade,
          telemetriaId: passagem.telemetriaId,
          primeiraVezEm: agora,
          recordeEm: agora,
          createdAt: agora,
          updatedAt: agora,
        });
        return "primeira";
      }
      const atual = umaCasa(Number(snap.get("velocidadeMaxKmh") ?? 0));
      if (velocidade <= atual) return null;
      tx.update(ref, {
        velocidadeMaxKmh: velocidade,
        telemetriaId: passagem.telemetriaId,
        recordeEm: agora,
        updatedAt: agora,
      });
      return "recorde";
    });
  }

  async listarPorUsuario(usuarioId: string): Promise<UsuarioConquista[]> {
    if (!usuarioId) return [];
    const snap = await firestore
      .collection(CARIMBOS)
      .where("usuarioId", "==", usuarioId)
      .get();
    return snap.docs
      .map(toCarimbo)
      .sort((a, b) => a.primeiraVezEm.localeCompare(b.primeiraVezEm));
  }

  async buscarCarimbos(
    usuarioIds: string[],
    conquistaId: string,
  ): Promise<UsuarioConquista[]> {
    const unicos = [...new Set(usuarioIds)].filter(Boolean);
    if (!conquistaId || unicos.length === 0) return [];
    const encontrados: UsuarioConquista[] = [];
    for (let i = 0; i < unicos.length; i += LOTE_GET_ALL) {
      const refs = unicos
        .slice(i, i + LOTE_GET_ALL)
        .map((uid) => firestore.collection(CARIMBOS).doc(idCarimbo(uid, conquistaId)));
      const snaps = await firestore.getAll(...refs);
      for (const snap of snaps) {
        if (snap.exists) encontrados.push(toCarimbo(snap));
      }
    }
    return encontrados;
  }

  async limparPorUsuario(usuarioId: string): Promise<void> {
    if (!usuarioId) return;
    for (let rodada = 0; rodada < RODADAS_LIMPEZA; rodada += 1) {
      const snap = await firestore
        .collection(CARIMBOS)
        .where("usuarioId", "==", usuarioId)
        .limit(LOTE_LIMPEZA)
        .get();
      if (snap.empty) return;
      const lote = firestore.batch();
      snap.docs.forEach((doc) => lote.delete(doc.ref));
      await lote.commit();
      if (snap.size < LOTE_LIMPEZA) return;
    }
  }
}
