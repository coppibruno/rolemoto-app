import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  TelemetriaRole,
  TelemetriaRoleCreate,
} from "../../types/telemetria-role";
import type {TelemetriaRoleRepository} from "../interfaces/telemetria-role.repository";
import {idTelemetria} from "../../lib/telemetria-role";
import {toIso, toTimestamp} from "./mapper";

const COLECAO = "userstelemetria";

const toDoc = (snap: DocumentSnapshot): TelemetriaRole => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    roleId: String(data.roleId ?? ""),
    velocidadeMaxKmh: Number(data.velocidadeMaxKmh ?? 0),
    velocidadeMediaKmh: Number(data.velocidadeMediaKmh ?? 0),
    distanciaKm: Number(data.distanciaKm ?? 0),
    tempoSegundos: Number(data.tempoSegundos ?? 0),
    tempoMovimentoSegundos: Number(data.tempoMovimentoSegundos ?? 0),
    iniciadoEm: toIso(data.iniciadoEm),
    encerradoEm: toIso(data.encerradoEm),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

export class FirestoreTelemetriaRoleRepository
implements TelemetriaRoleRepository {
  async buscarPorId(id: string): Promise<TelemetriaRole | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toDoc(snap);
  }

  async criar(
    dados: TelemetriaRoleCreate,
  ): Promise<TelemetriaRole | "conflito"> {
    const id = idTelemetria(dados.usuarioId, dados.roleId);
    const ref = firestore.collection(COLECAO).doc(id);
    const existente = await ref.get();
    if (existente.exists) {
      return "conflito";
    }

    await ref.set({
      usuarioId: dados.usuarioId,
      roleId: dados.roleId,
      velocidadeMaxKmh: dados.velocidadeMaxKmh,
      velocidadeMediaKmh: dados.velocidadeMediaKmh,
      distanciaKm: dados.distanciaKm,
      tempoSegundos: dados.tempoSegundos,
      tempoMovimentoSegundos: dados.tempoMovimentoSegundos,
      iniciadoEm: toTimestamp(dados.iniciadoEm),
      encerradoEm: toTimestamp(dados.encerradoEm),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(id);
    return criado as TelemetriaRole;
  }
}
