import {FieldValue, type DocumentData} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {
  aplicarReserva,
  type EstadoCotaMapa,
} from "../../lib/mapas-google/cota";
import {ymdSaoPaulo} from "../../lib/quando";
import type {
  MapasGoogleRepository,
  ReservaMapaGoogle,
} from "../interfaces/mapas-google.repository";

const COLECAO = "config";
const DOC = "mapasGoogle";
const PERIODO = /^\d{4}-\d{2}$/;

const periodoCorrente = (): string => ymdSaoPaulo(new Date()).slice(0, 7);

const lerEstado = (dados: DocumentData | undefined): EstadoCotaMapa | null => {
  if (!dados) return null;
  const periodo = dados.periodo;
  const cargas = dados.cargas;
  if (typeof periodo !== "string" || !PERIODO.test(periodo)) return null;
  if (typeof cargas !== "number" || !Number.isFinite(cargas) || cargas < 0) {
    return null;
  }
  return {periodo, cargas: Math.floor(cargas)};
};

export class FirestoreMapasGoogleRepository implements MapasGoogleRepository {
  async reservar(): Promise<ReservaMapaGoogle> {
    const ref = firestore.collection(COLECAO).doc(DOC);
    const periodo = periodoCorrente();

    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const atual = snap.exists ? lerEstado(snap.data()) : null;
      const resultado = aplicarReserva(atual, periodo);

      if (resultado.gravar) {
        tx.set(ref, {
          periodo: resultado.estado.periodo,
          cargas: resultado.estado.cargas,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return {
        provedor: resultado.provedor,
        marco: resultado.marco,
        periodo: resultado.estado.periodo,
        cargas: resultado.estado.cargas,
      };
    });
  }
}
