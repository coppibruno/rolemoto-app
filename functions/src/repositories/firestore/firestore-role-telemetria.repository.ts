import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  PontoTelemetria,
  RoleTelemetria,
  RoleTelemetriaNovo,
} from "../../types/role-telemetria";
import type {RoleTelemetriaRepository} from "../interfaces/role-telemetria.repository";
import {toIso, toTimestamp} from "./mapper";

const COLECAO = "rolestelemetria";
const LIMITE_PADRAO = 50;
const LIMITE_MAX = 100;

const toPonto = (valor: unknown): PontoTelemetria => {
  const o = valor && typeof valor === "object" ? (valor as Record<string, unknown>) : {};
  return {
    lat: Number(o.lat ?? 0),
    lng: Number(o.lng ?? 0),
    nome: String(o.nome ?? ""),
    endereco: String(o.endereco ?? ""),
  };
};

const toDoc = (snap: DocumentSnapshot): RoleTelemetria => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    titulo: String(data.titulo ?? ""),
    velocidadeMaxKmh: Number(data.velocidadeMaxKmh ?? 0),
    velocidadeMediaKmh: Number(data.velocidadeMediaKmh ?? 0),
    distanciaKm: Number(data.distanciaKm ?? 0),
    tempoSegundos: Number(data.tempoSegundos ?? 0),
    tempoMovimentoSegundos: Number(data.tempoMovimentoSegundos ?? 0),
    iniciadoEm: toIso(data.iniciadoEm),
    encerradoEm: toIso(data.encerradoEm),
    pontoInicio: toPonto(data.pontoInicio),
    pontoFim: toPonto(data.pontoFim),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreRoleTelemetriaRepository
implements RoleTelemetriaRepository {
  async buscarPorId(id: string): Promise<RoleTelemetria | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toDoc(snap);
  }

  async criar(dados: RoleTelemetriaNovo): Promise<RoleTelemetria> {
    const ref = await firestore.collection(COLECAO).add({
      usuarioId: dados.usuarioId,
      titulo: dados.titulo,
      velocidadeMaxKmh: dados.velocidadeMaxKmh,
      velocidadeMediaKmh: dados.velocidadeMediaKmh,
      distanciaKm: dados.distanciaKm,
      tempoSegundos: dados.tempoSegundos,
      tempoMovimentoSegundos: dados.tempoMovimentoSegundos,
      iniciadoEm: toTimestamp(dados.iniciadoEm),
      encerradoEm: toTimestamp(dados.encerradoEm),
      pontoInicio: dados.pontoInicio,
      pontoFim: dados.pontoFim,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(ref.id);
    return criado as RoleTelemetria;
  }

  async listarPorUsuario(
    usuarioId: string,
    opcoes?: {limite?: number},
  ): Promise<RoleTelemetria[]> {
    const limite = Math.min(
      Math.max(opcoes?.limite ?? LIMITE_PADRAO, 1),
      LIMITE_MAX,
    );
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .orderBy("encerradoEm", "desc")
      .limit(limite)
      .get();
    return snap.docs.map(toDoc);
  }
}
