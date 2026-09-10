"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export const useProtecaoRotaApp = () => {
  const { firebaseUser, usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.replace("/login");
      return;
    }

    if (!usuario) {
      router.replace("/primeiro-acesso");
    }
  }, [loading, firebaseUser, usuario, router]);

  const autorizado = !loading && Boolean(firebaseUser) && Boolean(usuario);

  return { loading, autorizado };
};
