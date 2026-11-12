"use client";

import { useCallback, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { CupomOferta, OfertaLocal } from "@/types/oferta-local";
import { ofertaLocalService } from "../../services/oferta-local.service";
import { CUPOM_ERRO } from "../constants";

type Props = {
  localId: string;
  /** A oferta saiu do ar entre a lista e o toque. */
  onForaDoAr: () => void;
};

export const useCupomOferta = ({ localId, onForaDoAr }: Props) => {
  const [oferta, setOferta] = useState<OfertaLocal | null>(null);
  const [cupom, setCupom] = useState<CupomOferta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const pedido = useRef(0);

  const fechar = useCallback(() => {
    pedido.current += 1;
    setOferta(null);
    setCupom(null);
    setErro(null);
  }, []);

  const abrir = useCallback(
    async (alvo: OfertaLocal) => {
      const meu = ++pedido.current;
      setOferta(alvo);
      setCupom(null);
      setErro(null);
      try {
        const resposta = await ofertaLocalService.abrirCupom(localId, alvo.id);
        if (meu === pedido.current) setCupom(resposta);
      } catch (e) {
        if (meu !== pedido.current) return;
        if (e instanceof ApiError && (e.status === 409 || e.status === 404)) {
          fechar();
          onForaDoAr();
          return;
        }
        setErro(e instanceof ApiError ? e.message : CUPOM_ERRO);
      }
    },
    [fechar, localId, onForaDoAr],
  );

  return { oferta, cupom, erro, abrir, fechar };
};
