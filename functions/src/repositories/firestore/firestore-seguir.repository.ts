import type {DocumentSnapshot, Query} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {erroDe, log} from "../../lib/log";
import type {
  PaginaVinculos,
  ResultadoDeixarSeguir,
  ResultadoSeguir,
  VinculoEntre,
  VinculoSeguir,
} from "../../types/seguir";
import {LIMITE_PAGINA_SEGUIR} from "../../types/seguir";
import type {SeguirRepository} from "../interfaces/seguir.repository";
import {toIso} from "./mapper";

const COLECAO = "usersseguir";
const USUARIOS = "users";
const RODADAS_LIMPEZA = 50;

const idVinculo = (seguidorId: string, seguidoId: string): string =>
  `${seguidorId}_${seguidoId}`;

const lerContador = (
  data: Record<string, unknown> | undefined,
  chave: string,
): number => {
  const valor = data?.[chave];
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
    return 0;
  }
  return Math.floor(valor);
};

const toVinculo = (snap: DocumentSnapshot): VinculoSeguir => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    seguidorId: String(data.seguidorId ?? ""),
    seguidoId: String(data.seguidoId ?? ""),
    createdAt: toIso(data.createdAt),
  };
};

const vazio = (): VinculoEntre => ({
  seguidoPorMim: false,
  segueVoce: false,
});

export class FirestoreSeguirRepository implements SeguirRepository {
  async seguir(
    seguidorId: string,
    seguidoId: string,
  ): Promise<ResultadoSeguir> {
    const vinculoRef = firestore.collection(COLECAO).doc(
      idVinculo(seguidorId, seguidoId),
    );
    const euRef = firestore.collection(USUARIOS).doc(seguidorId);
    const outroRef = firestore.collection(USUARIOS).doc(seguidoId);

    return firestore.runTransaction(async (tx) => {
      const vinculo = await tx.get(vinculoRef);
      const eu = await tx.get(euRef);
      const outro = await tx.get(outroRef);
      if (!outro.exists) {
        return "alvo_ausente";
      }
      if (!eu.exists) {
        return "seguidor_ausente";
      }
      if (vinculo.exists) {
        return "existente";
      }

      tx.set(vinculoRef, {
        seguidorId,
        seguidoId,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(euRef, {
        seguindo: lerContador(eu.data(), "seguindo") + 1,
      });
      tx.update(outroRef, {
        seguidores: lerContador(outro.data(), "seguidores") + 1,
      });
      return "criado";
    });
  }

  async deixarDeSeguir(
    seguidorId: string,
    seguidoId: string,
  ): Promise<ResultadoDeixarSeguir> {
    const vinculoRef = firestore.collection(COLECAO).doc(
      idVinculo(seguidorId, seguidoId),
    );
    const euRef = firestore.collection(USUARIOS).doc(seguidorId);
    const outroRef = firestore.collection(USUARIOS).doc(seguidoId);

    return firestore.runTransaction(async (tx) => {
      const vinculo = await tx.get(vinculoRef);
      if (!vinculo.exists) {
        return "ausente";
      }
      const eu = await tx.get(euRef);
      const outro = await tx.get(outroRef);
      tx.delete(vinculoRef);
      if (eu.exists) {
        tx.update(euRef, {
          seguindo: Math.max(0, lerContador(eu.data(), "seguindo") - 1),
        });
      }
      if (outro.exists) {
        tx.update(outroRef, {
          seguidores: Math.max(0, lerContador(outro.data(), "seguidores") - 1),
        });
      }
      return "removido";
    });
  }

  async listarSeguindo(
    uid: string,
    cursor: string | null,
  ): Promise<PaginaVinculos> {
    return this.listar("seguidorId", uid, cursor);
  }

  async listarSeguidores(
    uid: string,
    cursor: string | null,
  ): Promise<PaginaVinculos> {
    return this.listar("seguidoId", uid, cursor);
  }

  async listarSeguidosRecentes(uid: string, limite: number): Promise<string[]> {
    if (!uid || limite < 1) return [];
    const snap = await firestore
      .collection(COLECAO)
      .where("seguidorId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limite)
      .get();
    return snap.docs
      .map((doc) => String(doc.get("seguidoId") ?? ""))
      .filter(Boolean);
  }

  async vinculosCom(
    tokenUid: string,
    uids: string[],
  ): Promise<Map<string, VinculoEntre>> {
    const mapa = new Map<string, VinculoEntre>();
    const outros = [...new Set(uids)].filter((uid) => uid && uid !== tokenUid);
    for (const uid of outros) {
      mapa.set(uid, vazio());
    }
    if (outros.length === 0) {
      return mapa;
    }

    const refs = outros.flatMap((uid) => [
      firestore.collection(COLECAO).doc(idVinculo(tokenUid, uid)),
      firestore.collection(COLECAO).doc(idVinculo(uid, tokenUid)),
    ]);
    const chaves = outros.flatMap((uid) => [
      {uid, tipo: "eu" as const},
      {uid, tipo: "ele" as const},
    ]);

    for (let i = 0; i < refs.length; i += 100) {
      const fatiaRefs = refs.slice(i, i + 100);
      const fatiaChaves = chaves.slice(i, i + 100);
      const snaps = await firestore.getAll(...fatiaRefs);
      snaps.forEach((snap, indice) => {
        const chave = fatiaChaves[indice];
        const atual = chave ? mapa.get(chave.uid) : undefined;
        if (!atual || !snap.exists || !chave) {
          return;
        }
        if (chave.tipo === "eu") {
          atual.seguidoPorMim = true;
          return;
        }
        atual.segueVoce = true;
      });
    }
    return mapa;
  }

  async limparPorUsuario(uid: string): Promise<void> {
    const falhouSeguindo = await this.limparLado(uid, "seguidorId");
    const falhouSeguidores = await this.limparLado(uid, "seguidoId");
    if (falhouSeguindo || falhouSeguidores) {
      throw new Error("Falha ao limpar vínculos de seguir");
    }
  }

  private async listar(
    campo: "seguidorId" | "seguidoId",
    uid: string,
    cursor: string | null,
  ): Promise<PaginaVinculos> {
    let consulta: Query = firestore
      .collection(COLECAO)
      .where(campo, "==", uid)
      .orderBy("createdAt", "desc")
      .limit(LIMITE_PAGINA_SEGUIR);

    if (cursor) {
      const cursorSnap = await firestore.collection(COLECAO).doc(cursor).get();
      if (!cursorSnap.exists || String(cursorSnap.get(campo) ?? "") !== uid) {
        return {ok: false};
      }
      consulta = consulta.startAfter(cursorSnap);
    }

    const snap = await consulta.get();
    const vinculos = snap.docs.map(toVinculo);
    const ultimo = vinculos[vinculos.length - 1];
    const proximoCursor = snap.size === LIMITE_PAGINA_SEGUIR && ultimo ?
      ultimo.id :
      null;
    return {ok: true, vinculos, proximoCursor};
  }

  private async limparLado(
    uid: string,
    campo: "seguidorId" | "seguidoId",
  ): Promise<boolean> {
    const vistos = new Set<string>();
    let falhou = false;

    for (let rodada = 0; rodada < RODADAS_LIMPEZA; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO)
        .where(campo, "==", uid)
        .limit(100)
        .get();
      const novos = snap.docs.filter((doc) => !vistos.has(doc.id));
      if (novos.length === 0) {
        break;
      }
      for (const doc of novos) {
        vistos.add(doc.id);
        try {
          await this.apagarVinculo(uid, doc.id, campo);
        } catch (error) {
          falhou = true;
          log.warn("Seguir", "Falha ao apagar vínculo na exclusão", {
            uid,
            vinculoId: doc.id,
            ...erroDe(error),
          });
        }
      }
      if (snap.size < 100) {
        break;
      }
    }
    return falhou;
  }

  private async apagarVinculo(
    uidSaindo: string,
    vinculoId: string,
    campo: "seguidorId" | "seguidoId",
  ): Promise<void> {
    const vinculoRef = firestore.collection(COLECAO).doc(vinculoId);
    await firestore.runTransaction(async (tx) => {
      const vinculo = await tx.get(vinculoRef);
      if (!vinculo.exists) {
        return;
      }
      const data = vinculo.data() ?? {};
      const outroId = campo === "seguidorId" ?
        String(data.seguidoId ?? "") :
        String(data.seguidorId ?? "");
      const outroRef = outroId ?
        firestore.collection(USUARIOS).doc(outroId) :
        null;
      const outro = outroRef ? await tx.get(outroRef) : null;
      tx.delete(vinculoRef);
      if (!outroRef || !outro?.exists || !outroId || outroId === uidSaindo) {
        return;
      }
      const chave = campo === "seguidorId" ? "seguidores" : "seguindo";
      const dadosOutro = outro.data();
      tx.update(outroRef, {
        [chave]: Math.max(0, lerContador(dadosOutro, chave) - 1),
      });
    });
  }
}
