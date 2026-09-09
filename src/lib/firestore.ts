import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Usuario, UsuarioForm, Pilotagem } from "@/types/user";
import type { Role, RoleForm } from "@/types/role";
import type { Solicitacao } from "@/types/solicitacao";

// --- Usuários ---

export const criarUsuario = async (uid: string, dados: UsuarioForm) => {
  await setDoc(doc(db, "users", uid), {
    ...dados,
    createdAt: serverTimestamp(),
  });
};

export const buscarUsuario = async (
  uid: string
): Promise<Usuario | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as Usuario;
};

export const atualizarUsuario = async (
  uid: string,
  dados: Partial<UsuarioForm>
) => {
  await updateDoc(doc(db, "users", uid), dados);
};

export const criarPerfilPrimeiroAcesso = async (
  uid: string,
  dados: {
    nome: string;
    apelido: string;
    moto: string;
    pilotagem: Pilotagem;
    fotoUrl: string;
  }
) => {
  await setDoc(doc(db, "users", uid), {
    ...dados,
    cidade: "",
    createdAt: serverTimestamp(),
  });
};

// --- Rolês ---

export const criarRole = async (dados: RoleForm): Promise<string> => {
  const docRef = await addDoc(collection(db, "roles"), {
    ...dados,
    participantes: [dados.criadorId],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const buscarRole = async (id: string): Promise<Role | null> => {
  const snap = await getDoc(doc(db, "roles", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Role;
};

export const listarRoles = async (): Promise<Role[]> => {
  const q = query(collection(db, "roles"), orderBy("dataHoraSaida", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Role);
};

// --- Solicitações ---

export const criarSolicitacao = async (
  roleId: string,
  userId: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, "solicitacoes"), {
    roleId,
    userId,
    status: "pendente",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const listarSolicitacoesPorRole = async (
  roleId: string
): Promise<Solicitacao[]> => {
  const q = query(
    collection(db, "solicitacoes"),
    where("roleId", "==", roleId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Solicitacao);
};

export const atualizarStatusSolicitacao = async (
  id: string,
  status: "aceita" | "recusada"
) => {
  await updateDoc(doc(db, "solicitacoes", id), { status });
};
