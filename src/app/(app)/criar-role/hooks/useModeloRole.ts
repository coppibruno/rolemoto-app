"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { RoleModelo } from "@/types/role";
import {
  ERRO_MODELO_403,
  ERRO_MODELO_404,
  ERRO_MODELO_REDE,
} from "../constants";
import { rolesService } from "../services/roles.service";
import type { ErroModelo } from "../types";

const classificarErro = (erro: unknown): ErroModelo => {
  if (erro instanceof ApiError) {
    if (erro.status === 403) {
      return { tipo: "proibido", mensagem: ERRO_MODELO_403 };
    }
    if (erro.status === 404) {
      return { tipo: "nao-encontrado", mensagem: ERRO_MODELO_404 };
    }
  }
  return { tipo: "rede", mensagem: ERRO_MODELO_REDE };
};

export const useModeloRole = (roleId: string | undefined) => {
  const [modelo, setModelo] = useState<RoleModelo | null>(null);
  const [carregando, setCarregando] = useState(Boolean(roleId));
  const [erro, setErro] = useState<ErroModelo | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useEffect(() => {
    if (!roleId) {
      setModelo(null);
      setCarregando(false);
      setErro(null);
      return;
    }

    let cancelado = false;
    setCarregando(true);
    setErro(null);
    setModelo(null);

    rolesService
      .buscarModelo(roleId)
      .then((resposta) => {
        if (cancelado) return;
        setModelo(resposta);
      })
      .catch((falha: unknown) => {
        console.error(falha);
        if (cancelado) return;
        setModelo(null);
        setErro(classificarErro(falha));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [roleId, ticket]);

  return { modelo, carregando, erro, recarregar };
};
