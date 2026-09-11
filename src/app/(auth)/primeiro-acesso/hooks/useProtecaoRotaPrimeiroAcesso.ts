"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { destinoSeguro, urlLoginComNext } from "@/lib/destino-pos-auth";

export const useProtecaoRotaPrimeiroAcesso = (next: string | null) => {
  const { firebaseUser, usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.replace(urlLoginComNext(destinoSeguro(next)));
      return;
    }

    if (usuario) {
      router.replace(destinoSeguro(next));
    }
  }, [loading, firebaseUser, usuario, next, router]);

  const bloqueado = loading || !firebaseUser || Boolean(usuario);

  return { bloqueado };
};
