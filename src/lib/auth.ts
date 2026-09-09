/**
 * Funções de autenticação do Rolemoto App.
 *
 * Utiliza o Firebase Auth com:
 * - **Login social** via Google (popup)
 * - **Cadastro manual** com email e senha
 * - **Login manual** com email e senha
 *
 * Após o login/cadastro, o `AuthProvider` detecta o novo usuário
 * através do `onAuthStateChanged` e carrega o perfil do Firestore.
 *
 * O provedor Google deve estar habilitado no console do Firebase:
 * Firebase Console → Authentication → Sign-in method
 */
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";

const googleProvider = new GoogleAuthProvider();

/**
 * Realiza login com conta Google via popup.
 * @returns O objeto `User` do Firebase com dados básicos (uid, email, displayName, photoURL)
 */
export const loginComGoogle = async () => {
  const resultado = await signInWithPopup(auth, googleProvider);
  return resultado.user;
};

/**
 * Cria uma nova conta com email e senha.
 * O provedor "Email/Password" deve estar habilitado no console do Firebase.
 * @param email - Email do novo usuário
 * @param senha - Senha (mínimo 6 caracteres, exigido pelo Firebase)
 * @returns O objeto `User` do Firebase recém-criado
 */
export const cadastrarComEmail = async (email: string, senha: string) => {
  const resultado = await createUserWithEmailAndPassword(auth, email, senha);
  return resultado.user;
};

/**
 * Realiza login com email e senha já cadastrados.
 * @param email - Email do usuário
 * @param senha - Senha do usuário
 * @returns O objeto `User` do Firebase
 */
export const loginComEmail = async (email: string, senha: string) => {
  const resultado = await signInWithEmailAndPassword(auth, email, senha);
  return resultado.user;
};

/**
 * Encerra a sessão do usuário atual.
 * O `AuthProvider` detecta automaticamente o logout via `onAuthStateChanged`.
 */
export const logout = async () => {
  await signOut(auth);
};
