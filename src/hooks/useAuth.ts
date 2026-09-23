/**
 * Hook para acessar o estado de autenticação do usuário.
 *
 * Fornece acesso ao contexto do `AuthProvider`, incluindo:
 * - `firebaseUser` — objeto do Firebase Auth (null se deslogado)
 * - `usuario` — perfil do Firestore (null se não cadastrado ainda)
 * - `loading` — indica se o estado de auth ainda está sendo carregado
 * - `loginComGoogle()` — inicia login via Google
 * - `cadastrarComEmail(email, senha)` — cria conta com email/senha
 * - `loginComEmail(email, senha)` — faz login com email/senha
 * - `vincularSenha(senha)` — liga senha à conta Google
 * - `temSenha` — conta já tem provedor e-mail/senha
 * - `logout()` — encerra a sessão
 * - `recarregarPerfil()` — recarrega o perfil do Firestore
 *
 * @example
 * ```tsx
 * const { firebaseUser, usuario, loading, loginComGoogle } = useAuth();
 *
 * if (loading) return <Loading />;
 * if (!firebaseUser) return <TelaLogin />;
 * ```
 *
 * @throws {Error} Se usado fora do `AuthProvider`
 */
"use client";

import { useContext } from "react";
import { AuthContext, type AuthContextType } from "@/components/providers/AuthProvider";

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
};
