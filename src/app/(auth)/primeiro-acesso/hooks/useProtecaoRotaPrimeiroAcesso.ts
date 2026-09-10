"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export const useProtecaoRotaPrimeiroAcesso = () => {
  const { firebaseUser, usuario, loading } = useAuth();
  const router = useRouter();
  const [formLiberado, setFormLiberado] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.replace("/login");
      return;
    }

    if (usuario && !formLiberado) {
      router.replace("/");
      return;
    }

    if (!usuario) {
      setFormLiberado(true);
    }
  }, [loading, firebaseUser, usuario, formLiberado, router]);

  const bloqueado =
    loading || !firebaseUser || (Boolean(usuario) && !formLiberado);

  return { bloqueado };
};
