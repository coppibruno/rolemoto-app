"use client";

import { useCallback, useEffect, useState } from "react";
import type { OfertaLocal } from "@/types/oferta-local";
import { ofertaLocalService } from "../../services/oferta-local.service";

/** Ofertas ativas do local. Falha na leitura só esconde o bloco. */
export const useOfertasLocal = (localId: string) => {
  const [ofertas, setOfertas] = useState<OfertaLocal[]>([]);

  const recarregar = useCallback(async () => {
    try {
      const lista = await ofertaLocalService.listar(localId);
      setOfertas(lista.filter((oferta) => oferta.ativa));
    } catch {
      setOfertas([]);
    }
  }, [localId]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { ofertas, recarregar };
};
