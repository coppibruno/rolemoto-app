"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { LocalDetalhe } from "@/types/local";
import { ERRO_CARREGAR } from "../constants";
import { localDetalheService } from "../services/local-detalhe.service";

export const useDetalheLocal = (id: string) => {
  const [local, setLocal] = useState<LocalDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    localDetalheService
      .buscar(id)
      .then((dados) => {
        if (!cancelado) setLocal(dados);
      })
      .catch((e) => {
        if (cancelado) return;
        setLocal(null);
        setErro(e instanceof ApiError ? e.message : ERRO_CARREGAR);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  return { local, carregando, erro };
};
