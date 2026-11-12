import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  OfertaLocal,
  OfertaLocalDados,
  ResultadoAtualizarOferta,
  ResultadoCriarOferta,
  TipoOfertaLocal,
} from "../../types/oferta-local";
import type {OfertaLocalRepository} from "../interfaces/oferta-local.repository";
import {toIso} from "./mapper";

const COLECAO = "ofertaslocal";

const numeroOuNull = (valor: unknown): number | null =>
  typeof valor === "number" && Number.isFinite(valor) ? valor : null;

const horaOuNull = (valor: unknown): string | null =>
  typeof valor === "string" && valor ? valor : null;

const toOferta = (snap: DocumentSnapshot): OfertaLocal => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    localId: String(data.localId ?? ""),
    titulo: String(data.titulo ?? ""),
    tipo: (data.tipo ?? "brinde") as TipoOfertaLocal,
    valor: numeroOuNull(data.valor),
    codigo: String(data.codigo ?? ""),
    regra: String(data.regra ?? ""),
    tetoDia: numeroOuNull(data.tetoDia),
    dias: Array.isArray(data.dias) ?
      data.dias.filter((d): d is number => typeof d === "number") :
      [],
    horaInicio: horaOuNull(data.horaInicio),
    horaFim: horaOuNull(data.horaFim),
    ativa: data.ativa === true,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

const camposDados = (dados: OfertaLocalDados) => ({
  titulo: dados.titulo,
  tipo: dados.tipo,
  valor: dados.valor,
  codigo: dados.codigo,
  regra: dados.regra,
  tetoDia: dados.tetoDia,
  dias: dados.dias,
  horaInicio: dados.horaInicio,
  horaFim: dados.horaFim,
});

const codigoEmUso = (docs: DocumentSnapshot[], codigo: string, ignorarId?: string): boolean =>
  docs.some((doc) =>
    doc.id !== ignorarId &&
    String(doc.get("codigo") ?? "").toUpperCase() === codigo.toUpperCase(),
  );

const ordenarPorAtualizacao = (ofertas: OfertaLocal[]): OfertaLocal[] =>
  ofertas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export class FirestoreOfertaLocalRepository implements OfertaLocalRepository {
  private doLocal(localId: string) {
    return firestore.collection(COLECAO).where("localId", "==", localId);
  }

  async listarPorLocal(localId: string): Promise<OfertaLocal[]> {
    const snap = await this.doLocal(localId).get();
    return ordenarPorAtualizacao(snap.docs.map(toOferta));
  }

  async listarAtivas(): Promise<OfertaLocal[]> {
    const snap = await firestore.collection(COLECAO).where("ativa", "==", true).get();
    return snap.docs.map(toOferta);
  }

  async buscarPorId(id: string): Promise<OfertaLocal | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    return snap.exists ? toOferta(snap) : null;
  }

  async criar(
    localId: string,
    dados: OfertaLocalDados,
    teto: number,
  ): Promise<ResultadoCriarOferta> {
    const ref = firestore.collection(COLECAO).doc();
    const resultado = await firestore.runTransaction(async (tx) => {
      const existentes = await tx.get(this.doLocal(localId));
      if (existentes.size >= teto) {
        return "teto" as const;
      }
      if (codigoEmUso(existentes.docs, dados.codigo)) {
        return "codigo" as const;
      }
      tx.set(ref, {
        localId,
        ...camposDados(dados),
        ativa: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return "criada" as const;
    });
    if (resultado !== "criada") {
      return {tipo: resultado};
    }
    return {tipo: "criada", oferta: toOferta(await ref.get())};
  }

  async atualizar(
    id: string,
    localId: string,
    dados: OfertaLocalDados & {ativa: boolean},
  ): Promise<ResultadoAtualizarOferta> {
    const ref = firestore.collection(COLECAO).doc(id);
    const resultado = await firestore.runTransaction(async (tx) => {
      const atual = await tx.get(ref);
      if (!atual.exists || atual.get("localId") !== localId) {
        return "ausente" as const;
      }
      const irmas = await tx.get(this.doLocal(localId));
      if (codigoEmUso(irmas.docs, dados.codigo, id)) {
        return "codigo" as const;
      }
      tx.update(ref, {
        ...camposDados(dados),
        ativa: dados.ativa,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return "atualizada" as const;
    });
    if (resultado !== "atualizada") {
      return {tipo: resultado};
    }
    return {tipo: "atualizada", oferta: toOferta(await ref.get())};
  }

  async definirAtiva(id: string, ativa: boolean): Promise<OfertaLocal | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    await ref.update({ativa, updatedAt: FieldValue.serverTimestamp()});
    const snap = await ref.get();
    return snap.exists ? toOferta(snap) : null;
  }

  async remover(id: string): Promise<void> {
    await firestore.collection(COLECAO).doc(id).delete();
  }

  async pausarPorLocal(localId: string): Promise<void> {
    const snap = await this.doLocal(localId).where("ativa", "==", true).get();
    if (snap.empty) {
      return;
    }
    const batch = firestore.batch();
    for (const doc of snap.docs) {
      batch.update(doc.ref, {ativa: false, updatedAt: FieldValue.serverTimestamp()});
    }
    await batch.commit();
  }
}
