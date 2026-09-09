/**
 * Único ponto de inicialização do Firebase Admin.
 * Rotas e regras de negócio NÃO importam firebase-admin diretamente.
 */
import {initializeApp, getApps} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp();
}

export const adminAuth = getAuth();
export const firestore = getFirestore();
