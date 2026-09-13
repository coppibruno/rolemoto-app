/**
 * Funções de autenticação do Rolemoto App.
 *
 * Utiliza o Firebase Auth com:
 * - **Login social** via Google (popup no browser; redirect no iOS/standalone)
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
  signInWithRedirect,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { dispositivosService } from "@/app/(app)/services/dispositivos.service";
import { obterToken } from "./fcm";
import { auth } from "./firebase";

const googleProvider = new GoogleAuthProvider();

type NavigatorStandalone = Navigator & { standalone?: boolean };

const deveUsarRedirect = () => {
  if (typeof window === "undefined") return false;
  if (window.location.hostname === "localhost") return false; // ← dev sempre usa popup
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as NavigatorStandalone).standalone === true;
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
  return standalone || ios;
};

/**
 * Login com Google: popup no browser; redirect no iOS ou PWA standalone.
 * No redirect o `User` só chega no próximo load via `getRedirectResult`.
 */
export const loginComGoogle = async () => {
  console.log("loginComGoogle 1");
  if (deveUsarRedirect()) {
    console.log("redirect ios");
    await signInWithRedirect(auth, googleProvider);
    return;
  }
  console.log("loginComGoogle 2", auth, googleProvider);
  const resultado = await signInWithPopup(auth, googleProvider);
  console.log("loginComGoogle 3", resultado);
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
 * Remove o token FCM deste aparelho (best-effort) antes do signOut.
 */
export const logout = async () => {
  try {
    const token = await obterToken();
    if (token) {
      await dispositivosService.remover(token);
    }
  } catch {
    // Falha de rede/401 não bloqueia o logout.
  }
  await signOut(auth);
};
