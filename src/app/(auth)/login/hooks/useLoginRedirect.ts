"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import type { Usuario } from "@/types/user";
import {
  destinoSeguro,
  urlPrimeiroAcessoComNext,
} from "@/lib/destino-pos-auth";

interface Props {
  firebaseUser: User | null;
  usuario: Usuario | null;
  loading: boolean;
  next: string | null;
}

/**
 * Redireciona se o usuário já estiver autenticado.
 * Retorna `pronto` = true quando a tela de login pode ser exibida.
 */
export const useLoginRedirect = ({
  firebaseUser,
  usuario,
  loading,
  next,
}: Props) => {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (firebaseUser) {
      router.replace(
        usuario
          ? destinoSeguro(next)
          : urlPrimeiroAcessoComNext(destinoSeguro(next)),
      );
    } else {
      setPronto(true);
    }
  }, [loading, firebaseUser, usuario, next, router]);

  return { pronto };
};
