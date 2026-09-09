"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";

interface Props {
  firebaseUser: User | null;
  loading: boolean;
}

/**
 * Redireciona para a home se o usuário já estiver autenticado.
 * Retorna `pronto` = true quando a tela de login pode ser exibida.
 */
export const useLoginRedirect = ({ firebaseUser, loading }: Props) => {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (firebaseUser) {
      router.replace("/");
    } else {
      setPronto(true);
    }
  }, [loading, firebaseUser, router]);

  return { pronto };
};
