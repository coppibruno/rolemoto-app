"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { destinoAposDefinirSenha } from "@/lib/destino-apos-auth";
import { urlLoginComNext } from "@/lib/destino-pos-auth";

export const useProtecaoRotaDefinirSenha = (next: string | null) => {
  const { firebaseUser, usuario, loading, temSenha } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.replace(urlLoginComNext(next ?? "/"));
      return;
    }

    if (temSenha) {
      router.replace(destinoAposDefinirSenha(usuario, next));
    }
  }, [loading, firebaseUser, usuario, temSenha, next, router]);

  const bloqueado = loading || !firebaseUser || temSenha;

  return { bloqueado, email: firebaseUser?.email ?? "" };
};
