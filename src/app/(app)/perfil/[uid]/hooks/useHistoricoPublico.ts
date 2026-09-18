"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type {
  AbaHistoricoPublico,
  HistoricoPublico,
} from "@/types/perfil-publico";
import { ERRO_HISTORICO_PUBLICO } from "../constants";
import { perfilPublicoService } from "../services/perfil-publico.service";

export const useHistoricoPublico = (uid: string) => {
  const [historico, setHistorico] = useState<HistoricoPublico | null>(null);
  const [aba, setAba] = useState<AbaHistoricoPublico>("concluidos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      if (!uid) {
        setHistorico(null);
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro(null);
      try {
        const dados = await perfilPublicoService.historico(uid);
        if (cancelado) return;
        setHistorico(dados);
      } catch (e) {
        if (cancelado) return;
        const mensagem =
          e instanceof ApiError ? e.message : ERRO_HISTORICO_PUBLICO;
        setErro(mensagem);
        setHistorico(null);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [uid]);

  const itens =
    historico == null
      ? []
      : aba === "concluidos"
        ? historico.concluidos
        : historico.comoLider;

  return {
    historico,
    aba,
    setAba,
    itens,
    carregando,
    erro,
  };
};
