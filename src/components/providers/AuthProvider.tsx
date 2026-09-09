/**
 * Provider de autenticação do Rolemoto App.
 *
 * Envolve toda a aplicação (via `layout.tsx`) e gerencia:
 * 1. **Estado de autenticação** — escuta `onAuthStateChanged` do Firebase
 * 2. **Perfil do usuário** — carrega dados do Firestore após login
 * 3. **Funções de login/logout** — expõe via Context API
 *
 * Métodos de autenticação disponíveis:
 * - Login social com Google (popup)
 * - Cadastro manual com email e senha
 * - Login manual com email e senha
 *
 * Fluxo de autenticação:
 * ```
 * Usuário faz login/cadastro
 *   → onAuthStateChanged dispara
 *   → AuthProvider carrega perfil do Firestore
 *   → Se perfil não existe (primeiro login), `usuario` fica null
 *   → App redireciona para completar cadastro
 * ```
 */
"use client";

import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  loginComGoogle as _loginComGoogle,
  cadastrarComEmail as _cadastrarComEmail,
  loginComEmail as _loginComEmail,
  logout as _logout,
} from "@/lib/auth";
import { buscarUsuario } from "@/lib/firestore";
import type { Usuario } from "@/types/user";

export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  usuario: Usuario | null;
  loading: boolean;
  loginComGoogle: () => Promise<void>;
  cadastrarComEmail: (email: string, senha: string) => Promise<void>;
  loginComEmail: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfil = useCallback(async (uid: string) => {
    const perfil = await buscarUsuario(uid);
    setUsuario(perfil);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      console.log('chega aqui66', user);
      if (user) {
        try {
          await carregarPerfil(user.uid);
        } catch (error) {
          console.error("Erro ao carregar perfil do Firestore:", error);
          setUsuario(null);
        }
      } else {
        setUsuario(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [carregarPerfil]);

  const loginComGoogle = async () => {
    await _loginComGoogle();
  };

  const cadastrarComEmail = async (email: string, senha: string) => {
    await _cadastrarComEmail(email, senha);
  };

  const loginComEmail = async (email: string, senha: string) => {
    await _loginComEmail(email, senha);
  };

  const logout = async () => {
    await _logout();
    setUsuario(null);
  };

  const recarregarPerfil = async () => {
    if (firebaseUser) {
      await carregarPerfil(firebaseUser.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        usuario,
        loading,
        loginComGoogle,
        cadastrarComEmail,
        loginComEmail,
        logout,
        recarregarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
