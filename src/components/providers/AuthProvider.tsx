/**
 * Provider de autenticação do Rolemoto App.
 *
 * Envolve toda a aplicação (via `layout.tsx`) e gerencia:
 * 1. **Estado de autenticação** — escuta `onAuthStateChanged` do Firebase
 * 2. **Perfil do usuário** — carrega via `GET /perfil` após login
 * 3. **Funções de login/logout** — expõe via Context API
 *
 * Métodos de autenticação disponíveis:
 * - Login social com Google (nativo no Capacitor; popup/redirect no web/PWA — SPEC 040 / 012)
 * - Cadastro manual com email e senha
 * - Login manual com email e senha
 * - Vincular senha a conta Google (`vincularSenha`)
 *
 * Fluxo de autenticação:
 * ```
 * Usuário faz login/cadastro
 *   → onAuthStateChanged dispara
 *   → AuthProvider carrega perfil pela API
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
import {
  getRedirectResult,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  loginComGoogle as _loginComGoogle,
  cadastrarComEmail as _cadastrarComEmail,
  loginComEmail as _loginComEmail,
  vincularSenha as _vincularSenha,
  logout as _logout,
} from "@/lib/auth";
import { temProviderSenha } from "@/lib/provedor-senha";
import { perfilService } from "@/app/(app)/perfil/services/perfil.service";
import { assinarSeguir, lerVersaoSeguir } from "@/lib/seguir-contadores";
import type { Usuario } from "@/types/user";

export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  usuario: Usuario | null;
  loading: boolean;
  loginComGoogle: () => Promise<void>;
  cadastrarComEmail: (email: string, senha: string) => Promise<void>;
  loginComEmail: (email: string, senha: string) => Promise<void>;
  vincularSenha: (senha: string) => Promise<void>;
  temSenha: boolean;
  logout: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const INTERVALO_MINIMO_RETORNO_MS = 2000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfil = useCallback(async () => {
    const versao = lerVersaoSeguir();
    const perfil = await perfilService.buscar();
    setUsuario((atual) => {
      if (atual && lerVersaoSeguir() !== versao) return atual;
      return perfil;
    });
  }, []);

  useEffect(() => {
    return assinarSeguir((mudanca) => {
      setUsuario((atual) => {
        if (!atual) return atual;
        return {
          ...atual,
          seguindo: Math.max(0, (atual.seguindo ?? 0) + mudanca.delta),
        };
      });
    });
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    let ultimaBusca = 0;
    const recarregar = () => {
      if (document.visibilityState !== "visible") return;
      const agora = Date.now();
      if (agora - ultimaBusca < INTERVALO_MINIMO_RETORNO_MS) return;
      ultimaBusca = agora;
      carregarPerfil().catch((error) => {
        console.error("Erro ao atualizar perfil:", error);
      });
    };

    document.addEventListener("visibilitychange", recarregar);
    let removerApp: (() => void) | undefined;
    let ativo = true;
    void import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) recarregar();
        }),
      )
      .then((handle) => {
        if (!ativo) {
          void handle.remove();
          return;
        }
        removerApp = () => {
          void handle.remove();
        };
      })
      .catch(() => {
        /* web: plugin ausente */
      });

    return () => {
      ativo = false;
      document.removeEventListener("visibilitychange", recarregar);
      removerApp?.();
    };
  }, [firebaseUser, carregarPerfil]);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error("Erro no redirect do Google:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setLoading(true);
        try {
          await carregarPerfil();
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
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

  const vincularSenha = async (senha: string) => {
    await _vincularSenha(senha);
    const atual = auth.currentUser;
    if (atual) {
      await atual.reload();
      setFirebaseUser(auth.currentUser);
    }
  };

  const logout = async () => {
    await _logout();
    setUsuario(null);
  };

  const recarregarPerfil = useCallback(async () => {
    if (firebaseUser) {
      await carregarPerfil();
    }
  }, [firebaseUser, carregarPerfil]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        usuario,
        loading,
        loginComGoogle,
        cadastrarComEmail,
        loginComEmail,
        vincularSenha,
        temSenha: temProviderSenha(firebaseUser),
        logout,
        recarregarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
