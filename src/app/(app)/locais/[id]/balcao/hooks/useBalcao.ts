"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import type { BalcaoLocal, OfertaLocal } from "@/types/oferta-local";
import { ofertaLocalService } from "../../../services/oferta-local.service";

const ERRO_CARREGAR = "Não foi possível abrir o balcão";
const ERRO_ACAO = "Não foi possível salvar. Tente de novo.";

/** Quem não é dono nem admin volta ao detalhe do local. */
export const useBalcao = (localId: string) => {
  const router = useRouter();
  const [balcao, setBalcao] = useState<BalcaoLocal | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupadaId, setOcupadaId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setBalcao(await ofertaLocalService.balcao(localId));
      setErro(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        router.replace(`/locais/${localId}`);
        return;
      }
      setErro(e instanceof ApiError ? e.message : ERRO_CARREGAR);
    } finally {
      setCarregando(false);
    }
  }, [localId, router]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const executar = async (oferta: OfertaLocal, acao: () => Promise<unknown>) => {
    setOcupadaId(oferta.id);
    try {
      await acao();
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : ERRO_ACAO);
    } finally {
      setOcupadaId(null);
    }
  };

  const alternarPausa = (oferta: OfertaLocal) =>
    executar(oferta, () => ofertaLocalService.definirAtiva(localId, oferta.id, !oferta.ativa));

  const apagar = (oferta: OfertaLocal) =>
    executar(oferta, () => ofertaLocalService.apagar(localId, oferta.id));

  return { balcao, carregando, erro, ocupadaId, alternarPausa, apagar };
};
