"use client";

import { useCallback, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { DecisaoPiloto, SolicitacaoLider } from "@/types/aprovacao";
import {
  ANIMACAO_CARD_MS,
  confirmRecusar,
  ERRO_DECISAO,
  toastAceite,
  toastRecusa,
} from "../constants";
import { aprovacoesService } from "../services/aprovacoes.service";

export type ToastDecisaoEstado = {
  tipo: "aceite" | "recusa" | "erro";
  mensagem: string;
};

export type SaindoCard = {
  id: string;
  lado: "direita" | "esquerda";
};

const esperar = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

type Params = {
  onDecidido: (item: SolicitacaoLider, decisao: DecisaoPiloto) => void;
};

export const useDecisaoPiloto = ({ onDecidido }: Params) => {
  const [decidindoId, setDecidindoId] = useState<string | null>(null);
  const [saindo, setSaindo] = useState<SaindoCard | null>(null);
  const [toast, setToast] = useState<ToastDecisaoEstado | null>(null);
  const emVoo = useRef(false);

  const fecharToast = useCallback(() => setToast(null), []);

  const decidir = useCallback(
    async (item: SolicitacaoLider, decisao: DecisaoPiloto) => {
      if (emVoo.current) return;

      if (decisao === "recusar") {
        const ok = window.confirm(
          confirmRecusar(item.usuario.nome, item.role.titulo),
        );
        if (!ok) return;
      }

      emVoo.current = true;
      setDecidindoId(item.id);
      try {
        await aprovacoesService.decidir(item.id, decisao);
        setSaindo({
          id: item.id,
          lado: decisao === "aceitar" ? "direita" : "esquerda",
        });
        await esperar(ANIMACAO_CARD_MS);
        onDecidido(item, decisao);
        setToast({
          tipo: decisao === "aceitar" ? "aceite" : "recusa",
          mensagem:
            decisao === "aceitar"
              ? toastAceite(item.usuario.nome)
              : toastRecusa(item.usuario.nome),
        });
      } catch (erro) {
        setToast({
          tipo: "erro",
          mensagem: erro instanceof ApiError ? erro.message : ERRO_DECISAO,
        });
      } finally {
        emVoo.current = false;
        setDecidindoId(null);
        setSaindo(null);
      }
    },
    [onDecidido],
  );

  return { decidindoId, saindo, toast, fecharToast, decidir };
};
