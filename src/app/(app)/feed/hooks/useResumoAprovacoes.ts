"use client";

import { useEffect, useState } from "react";
import type { ResumoAprovacoes } from "@/types/aprovacao";
import { aprovacoesService } from "@/app/(app)/aprovacoes/services/aprovacoes.service";

export const useResumoAprovacoes = () => {
  const [resumo, setResumo] = useState<ResumoAprovacoes | null>(null);

  useEffect(() => {
    let cancelado = false;

    aprovacoesService
      .listar("pendente")
      .then((fila) => {
        if (!cancelado) setResumo(fila.resumo);
      })
      .catch(() => {
        if (!cancelado) setResumo(null);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return resumo;
};
