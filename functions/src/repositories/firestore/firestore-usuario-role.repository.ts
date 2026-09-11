import type {DocumentSnapshot} from "firebase-admin/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import type {
  UsuarioRole,
  UsuarioRoleCreate,
  UsuarioRoleDecisao,
  UsuarioRoleNotificar,
} from "../../types/usuario-role";
import type {UsuarioRoleRepository} from "../interfaces/usuario-role.repository";
import {toIso, toIsoOrNull} from "./mapper";

const COLECAO = "usersrole";
const LIMITE_POR_USUARIO = 100;
const LIMITE_INBOX = 100;

const idUsuarioRole = (usuarioId: string, roleId: string): string =>
  `${usuarioId}_${roleId}`;

const toUsuarioRole = (snap: DocumentSnapshot): UsuarioRole => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    usuarioId: String(data.usuarioId ?? ""),
    roleId: String(data.roleId ?? ""),
    criadorId: String(data.criadorId ?? ""),
    aceito: Boolean(data.aceito),
    notificar: data.notificar !== false,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    aceitoEm: toIsoOrNull(data.aceitoEm),
    recusadoEm: toIsoOrNull(data.recusadoEm),
  };
};

export class FirestoreUsuarioRoleRepository implements UsuarioRoleRepository {
  async buscarPorId(id: string): Promise<UsuarioRole | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toUsuarioRole(snap);
  }

  async buscarPorUsuarioERole(
    usuarioId: string,
    roleId: string,
  ): Promise<UsuarioRole | null> {
    return this.buscarPorId(idUsuarioRole(usuarioId, roleId));
  }

  async listarPendentesDoCriador(criadorId: string): Promise<UsuarioRole[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("criadorId", "==", criadorId)
      .where("aceito", "==", false)
      .where("recusadoEm", "==", null)
      .orderBy("createdAt", "asc")
      .limit(LIMITE_INBOX)
      .get();
    return snap.docs.map(toUsuarioRole);
  }

  async listarAceitosDoCriador(criadorId: string): Promise<UsuarioRole[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("criadorId", "==", criadorId)
      .where("aceito", "==", true)
      .orderBy("createdAt", "asc")
      .limit(LIMITE_INBOX)
      .get();
    return snap.docs.map(toUsuarioRole);
  }

  async contarPendentesDoCriador(criadorId: string): Promise<number> {
    const snap = await firestore
      .collection(COLECAO)
      .where("criadorId", "==", criadorId)
      .where("aceito", "==", false)
      .where("recusadoEm", "==", null)
      .count()
      .get();
    return snap.data().count;
  }

  async contarAceitosDoCriador(criadorId: string): Promise<number> {
    const snap = await firestore
      .collection(COLECAO)
      .where("criadorId", "==", criadorId)
      .where("aceito", "==", true)
      .count()
      .get();
    return snap.data().count;
  }

  async listarPorUsuario(usuarioId: string): Promise<UsuarioRole[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .limit(LIMITE_POR_USUARIO)
      .get();
    return snap.docs.map(toUsuarioRole);
  }

  async contarConfirmados(roleId: string): Promise<number> {
    const snap = await firestore
      .collection(COLECAO)
      .where("roleId", "==", roleId)
      .where("aceito", "==", true)
      .count()
      .get();
    return snap.data().count;
  }

  async listarConfirmadosDoRole(
    roleId: string,
    limite: number,
  ): Promise<UsuarioRole[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("roleId", "==", roleId)
      .where("aceito", "==", true)
      .limit(limite)
      .get();
    return snap.docs.map(toUsuarioRole);
  }

  async criar(dados: UsuarioRoleCreate): Promise<UsuarioRole> {
    const id = idUsuarioRole(dados.usuarioId, dados.roleId);
    const ref = firestore.collection(COLECAO).doc(id);
    const existente = await ref.get();
    if (existente.exists) {
      return toUsuarioRole(existente);
    }

    await ref.set({
      usuarioId: dados.usuarioId,
      roleId: dados.roleId,
      criadorId: dados.criadorId,
      aceito: false,
      notificar: true,
      aceitoEm: null,
      recusadoEm: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const criado = await this.buscarPorId(id);
    return criado as UsuarioRole;
  }

  async atualizarNotificar(
    id: string,
    dados: UsuarioRoleNotificar,
  ): Promise<UsuarioRole | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }
    await ref.update({
      notificar: dados.notificar,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return this.buscarPorId(id);
  }

  async decidir(
    id: string,
    dados: UsuarioRoleDecisao,
  ): Promise<UsuarioRole | null> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return null;
    }

    const atual = toUsuarioRole(snap);
    if (atual.aceitoEm !== null || atual.recusadoEm !== null) {
      return atual;
    }

    if (dados.decisao === "aceitar") {
      await ref.update({
        aceito: true,
        aceitoEm: FieldValue.serverTimestamp(),
        recusadoEm: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await ref.update({
        aceito: false,
        aceitoEm: null,
        recusadoEm: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return this.buscarPorId(id);
  }

  async remover(id: string): Promise<boolean> {
    const ref = firestore.collection(COLECAO).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return false;
    }
    await ref.delete();
    return true;
  }
}
