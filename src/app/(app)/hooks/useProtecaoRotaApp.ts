"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  destinoSeguro,
  urlLoginComNext,
  urlPrimeiroAcessoComNext,
} from "@/lib/destino-pos-auth";

export const useProtecaoRotaApp = () => {
  const { firebaseUser, usuario, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const destino = destinoSeguro(pathname);

    if (!firebaseUser) {
      router.replace(urlLoginComNext(destino));
      return;
    }

    if (!usuario) {
      router.replace(urlPrimeiroAcessoComNext(destino));
    }
  }, [loading, firebaseUser, usuario, pathname, router]);

  const autorizado = !loading && Boolean(firebaseUser) && Boolean(usuario);

  return { loading, autorizado };
};
