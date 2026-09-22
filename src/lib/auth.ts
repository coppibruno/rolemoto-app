/**
 * Funções de autenticação do Rolemoto App.
 *
 * Utiliza o Firebase Auth com:
 * - **Login social** via Google (nativo no Capacitor; popup/redirect no web/PWA)
 * - **Cadastro manual** com email e senha
 * - **Login manual** com email e senha
 *
 * Após o login/cadastro, o `AuthProvider` detecta o novo usuário
 * através do `onAuthStateChanged` e carrega o perfil do Firestore.
 *
 * O provedor Google deve estar habilitado no console do Firebase:
 * Firebase Console → Authentication → Sign-in method
 *
 * @see docs/specs/040-google-signin-nativo-capacitor.md
 */
import { Capacitor } from "@capacitor/core";
import {
  GoogleAuthProvider,
  signInWithCredential,
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
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as NavigatorStandalone).standalone === true;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return standalone || ios;
};

const loginComGoogleNativo = async () => {
  const { FirebaseAuthentication } = await import(
    "@capacitor-firebase/authentication"
  );
  const resultado = await FirebaseAuthentication.signInWithGoogle({
    skipNativeAuth: true,
  });
  const idToken = resultado.credential?.idToken;
  if (!idToken) {
    throw new Error("Token Google ausente");
  }
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);
  return cred.user;
};

/**
 * Login com Google: nativo no Capacitor; redirect no iOS/PWA standalone;
 * popup no browser. No redirect o `User` só chega no próximo load via
 * `getRedirectResult`.
 */
export const loginComGoogle = async () => {
  if (Capacitor.isNativePlatform()) {
    return loginComGoogleNativo();
  }

  if (deveUsarRedirect()) {
    await signInWithRedirect(auth, googleProvider);
    return;
  }

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
 * Remove o token FCM deste aparelho (best-effort) antes do signOut.
 * No Capacitor, também desloga o Google Sign-In nativo (best-effort).
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

  if (Capacitor.isNativePlatform()) {
    try {
      const { FirebaseAuthentication } = await import(
        "@capacitor-firebase/authentication"
      );
      await FirebaseAuthentication.signOut();
    } catch {
      // Sessão nativa ausente não bloqueia o signOut do JS SDK.
    }
  }

  await signOut(auth);
};
