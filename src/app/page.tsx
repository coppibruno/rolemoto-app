/**
 * Página principal — Redireciona com base no estado de autenticação.
 *
 * - Sem login → redireciona para `/login`
 * - Logado → exibe tela inicial (futuro: feed de rolês)
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { firebaseUser, usuario, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
    if (!loading && firebaseUser && !usuario) {
      router.replace("/primeiro-acesso");
    }
  }, [loading, firebaseUser, usuario, router]);

  if (loading) {
    return (
      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          color: "#ffffff",
        }}
      >
        <p>Carregando...</p>
      </main>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  if (!usuario) {
    return (
      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          color: "#ffffff",
        }}
      >
        <p>Carregando...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: "1.5rem",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        color: "#ffffff",
        padding: "1rem",
      }}
    >
      <h1>🏍️ Rolemoto</h1>
      <p>
        Bem-vindo, <strong>{usuario?.apelido || firebaseUser.displayName || "Motociclista"}</strong>!
      </p>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
        Em breve: feed de rolês disponíveis na sua região.
      </p>
      <button
        onClick={logout}
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "0.5rem",
          color: "#fff",
          cursor: "pointer",
          fontSize: "0.9rem",
        }}
      >
        Sair
      </button>
    </main>
  );
}
