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
  console.log("1", firebaseUser);
  useEffect(() => {
    if (loading) return;
    console.log("2", firebaseUser);
    if (firebaseUser) {
      router.replace("/");
    } else {
      setPronto(true);
    }
  }, [loading, firebaseUser, router]);

  return { pronto };
};
