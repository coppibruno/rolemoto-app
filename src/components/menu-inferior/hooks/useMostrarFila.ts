"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { aprovacoesService } from "@/app/(app)/aprovacoes/services/aprovacoes.service";

/** Fila só aparece para quem já recebeu pedidos nos próprios rolês. */
export const useMostrarFila = () => {
  const pathname = usePathname();
  const [temPedidos, setTemPedidos] = useState(false);

  useEffect(() => {
    let cancelado = false;

    aprovacoesService
      .listar("pendente")
      .then(({ resumo }) => {
        if (!cancelado) setTemPedidos(resumo.pendentes > 0 || resumo.aceitos > 0);
      })
      .catch(() => {
        if (!cancelado) setTemPedidos(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return temPedidos || pathname?.startsWith("/aprovacoes") === true;
};
