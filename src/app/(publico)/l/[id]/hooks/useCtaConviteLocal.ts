"use client";

import { useRouter } from "next/navigation";
import { pedirPermissaoERegistrar } from "@/app/(app)/hooks/useRegistroFcm";
import { useAuth } from "@/hooks/useAuth";
import { urlLoginComNext, urlPrimeiroAcessoComNext } from "@/lib/destino-pos-auth";
import { COPY_CTA, COPY_CTA_SUB } from "../constants";

export const useCtaConviteLocal = (id: string) => {
  const { firebaseUser, usuario, loading } = useAuth();
  const router = useRouter();
  const destino = `/locais/${id}`;
  const autenticado = Boolean(firebaseUser) && Boolean(usuario);

  const acionar = () => {
    if (loading) return;
    if (!firebaseUser) {
      router.push(urlLoginComNext(destino));
      return;
    }
    if (!usuario) {
      router.push(urlPrimeiroAcessoComNext(destino));
      return;
    }
    void pedirPermissaoERegistrar();
    router.push(destino);
  };

  return {
    acionar,
    disabled: loading,
    mostrarLinksAuth: !loading && !autenticado,
    label: COPY_CTA,
    subtitulo: COPY_CTA_SUB,
  };
};
