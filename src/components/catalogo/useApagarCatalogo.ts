"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";

const ERRO_APAGAR = "Não foi possível apagar. Tente de novo.";

export const useApagarCatalogo = (
  acao: () => Promise<void>,
  destino: string,
  confirmacao: string,
) => {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const apagar = async () => {
    if (ocupado) return;
    if (!window.confirm(confirmacao)) return;
    setOcupado(true);
    setErro(null);
    try {
      await acao();
      router.push(destino);
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : ERRO_APAGAR);
      setOcupado(false);
    }
  };

  return { ocupado, erro, apagar };
};
