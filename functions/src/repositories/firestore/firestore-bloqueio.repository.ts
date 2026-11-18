import type {DocumentSnapshot, Query} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {apelidoExibicao} from "../../lib/apelido";
import {idBloqueio} from "../../lib/moderacao";
import type {
  LinhaBloqueio,
  PaginaBloqueios,
  ResultadoBloquear,
  ResultadoDesbloquear,
  VinculoBloqueio,
} from "../../types/moderacao";
import {LIMITE_PAGINA_BLOQUEIOS} from "../../types/moderacao";
import type {BloqueioRepository} from "../interfaces/bloqueio.repository";
import {toIso} from "./mapper";
import {apagarPorCampo} from "./apagar-por-campo";

const COLECAO = "usersbloqueio";
const USUARIOS = "users";

const toVinculo = (snap: DocumentSnapshot): VinculoBloqueio => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    bloqueadorId: String(data.bloqueadorId ?? ""),
    bloqueadoId: String(data.bloqueadoId ?? ""),
    createdAt: toIso(data.createdAt),
  };
};

export class FirestoreBloqueioRepository implements BloqueioRepository {
  async bloquear(
    bloqueadorId: string,
    bloqueadoId: string,
  ): Promise<ResultadoBloquear> {
    const ref = firestore.collection(COLECAO).doc(
      idBloqueio(bloqueadorId, bloqueadoId),
    );
    const euRef = firestore.collection(USUARIOS).doc(bloqueadorId);
    const outroRef = firestore.collection(USUARIOS).doc(bloqueadoId);

    return firestore.runTransaction(async (tx) => {
      const [vinculo, eu, outro] = await Promise.all([
        tx.get(ref),
        tx.get(euRef),
        tx.get(outroRef),
      ]);
      if (!outro.exists) {
        return "alvo_ausente";
      }
      if (!eu.exists) {
        return "bloqueador_ausente";
      }
      if (vinculo.exists) {
        return "existente";
      }
      tx.set(ref, {
        id: ref.id,
        bloqueadorId,
        bloqueadoId,
        createdAt: FieldValue.serverTimestamp(),
      });
      return "criado";
    });
  }

  async desbloquear(
    bloqueadorId: string,
    bloqueadoId: string,
  ): Promise<ResultadoDesbloquear> {
    const ref = firestore.collection(COLECAO).doc(
      idBloqueio(bloqueadorId, bloqueadoId),
    );
    const snap = await ref.get();
    if (!snap.exists) {
      return "ausente";
    }
    await ref.delete();
    return "removido";
  }

  async existe(bloqueadorId: string, bloqueadoId: string): Promise<boolean> {
    const snap = await firestore
      .collection(COLECAO)
      .doc(idBloqueio(bloqueadorId, bloqueadoId))
      .get();
    return snap.exists;
  }

  async setDoPar(uid: string): Promise<Set<string>> {
    const set = new Set<string>();
    if (!uid) {
      return set;
    }
    const [comoBloqueador, comoBloqueado] = await Promise.all([
      firestore.collection(COLECAO).where("bloqueadorId", "==", uid).get(),
      firestore.collection(COLECAO).where("bloqueadoId", "==", uid).get(),
    ]);
    comoBloqueador.docs.forEach((doc) => {
      const outro = String(doc.get("bloqueadoId") ?? "");
      if (outro) {
        set.add(outro);
      }
    });
    comoBloqueado.docs.forEach((doc) => {
      const outro = String(doc.get("bloqueadorId") ?? "");
      if (outro) {
        set.add(outro);
      }
    });
    return set;
  }

  async listarDoBloqueador(
    bloqueadorId: string,
    cursor: string | null,
  ): Promise<
    | {ok: true; vinculos: VinculoBloqueio[]; proximoCursor: string | null}
    | {ok: false}
  > {
    let consulta: Query = firestore
      .collection(COLECAO)
      .where("bloqueadorId", "==", bloqueadorId)
      .orderBy("createdAt", "desc")
      .limit(LIMITE_PAGINA_BLOQUEIOS);

    if (cursor) {
      const cursorSnap = await firestore.collection(COLECAO).doc(cursor).get();
      if (
        !cursorSnap.exists ||
        String(cursorSnap.get("bloqueadorId") ?? "") !== bloqueadorId
      ) {
        return {ok: false};
      }
      consulta = consulta.startAfter(cursorSnap);
    }

    const snap = await consulta.get();
    const vinculos = snap.docs.map(toVinculo);
    const ultimo = vinculos[vinculos.length - 1];
    const proximoCursor =
      snap.size === LIMITE_PAGINA_BLOQUEIOS && ultimo ? ultimo.id : null;
    return {ok: true, vinculos, proximoCursor};
  }

  async paginaLinhas(
    bloqueadorId: string,
    cursor: string | null,
  ): Promise<{ok: true; pagina: PaginaBloqueios} | {ok: false}> {
    const pagina = await this.listarDoBloqueador(bloqueadorId, cursor);
    if (!pagina.ok) {
      return {ok: false};
    }
    const uids = pagina.vinculos.map((v) => v.bloqueadoId);
    const usuarios = uids.length > 0 ?
      await firestore.getAll(
        ...uids.map((uid) => firestore.collection(USUARIOS).doc(uid)),
      ) :
      [];
    const porUid = new Map(
      usuarios
        .filter((snap) => snap.exists)
        .map((snap) => {
          const data = snap.data() ?? {};
          return [
            snap.id,
            {
              nome: String(data.nome ?? ""),
              apelido: apelidoExibicao({
                nome: String(data.nome ?? ""),
                apelido: String(data.apelido ?? ""),
              }),
              fotoUrl: String(data.fotoUrl ?? ""),
            },
          ] as const;
        }),
    );

    const itens: LinhaBloqueio[] = [];
    for (const vinculo of pagina.vinculos) {
      const pessoa = porUid.get(vinculo.bloqueadoId);
      if (!pessoa) {
        continue;
      }
      itens.push({
        uid: vinculo.bloqueadoId,
        nome: pessoa.nome,
        apelido: pessoa.apelido,
        fotoUrl: pessoa.fotoUrl,
        bloqueadoEm: vinculo.createdAt,
      });
    }
    return {
      ok: true,
      pagina: {itens, proximoCursor: pagina.proximoCursor},
    };
  }

  async limparPorUsuario(uid: string): Promise<void> {
    await apagarPorCampo(COLECAO, "bloqueadorId", uid);
    await apagarPorCampo(COLECAO, "bloqueadoId", uid);
  }
}
