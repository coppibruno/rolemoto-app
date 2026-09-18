"use client";

import { useCallback, useEffect, useState } from "react";
import { favoritoLocalService } from "../services/favorito-local.service";
import { ERRO_FAVORITO } from "../constants";

type Props = {
  localId: string;
  favoritoInicial: boolean;
};

export const useFavoritoLocal = ({ localId, favoritoInicial }: Props) => {
  const [favorito, setFavorito] = useState(favoritoInicial);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setFavorito(favoritoInicial);
  }, [favoritoInicial, localId]);

  const alternar = useCallback(async () => {
    if (processando) return;
    const anterior = favorito;
    setFavorito(!anterior);
    setProcessando(true);
    setErro(null);

    try {
      if (anterior) {
        await favoritoLocalService.desfavoritar(localId);
      } else {
        await favoritoLocalService.favoritar(localId);
      }
    } catch {
      setFavorito(anterior);
      setErro(ERRO_FAVORITO);
    } finally {
      setProcessando(false);
    }
  }, [favorito, localId, processando]);

  return { favorito, processando, erro, alternar };
};
