"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { FACETAS_PADRAO, type FacetaBusca, type SugestaoLocal } from "@/types/sugestao-local";
import { sugestoesLocaisService } from "../services/sugestoes-locais.service";

export const useListaSugestoesLocais = () => {
  const [itens, setItens] = useState<SugestaoLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [resumoBusca, setResumoBusca] = useState<string | null>(null);
  const [facetas, setFacetas] = useState<FacetaBusca[]>([...FACETAS_PADRAO]);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    sugestoesLocaisService
      .listar()
      .then((dados) => {
        if (!cancelado) setItens(dados.itens);
      })
      .catch(() => {
        if (!cancelado) {
          setItens([]);
          setErro("Não foi possível carregar as sugestões");
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [ticket]);

  const remover = (id: string) => {
    setItens((atual) => atual.filter((item) => item.id !== id));
  };

  const alternarFaceta = (faceta: FacetaBusca) => {
    setFacetas((atual) =>
      atual.includes(faceta) ? atual.filter((item) => item !== faceta) : [...atual, faceta],
    );
  };

  const buscar = async () => {
    if (buscando) return;
    setBuscando(true);
    setErroBusca(null);
    setResumoBusca(null);
    try {
      const resultado = await sugestoesLocaisService.buscar(facetas);
      setResumoBusca(
        resultado.gravadas > 0
          ? `${resultado.gravadas} novas sugestões`
          : "Nenhum ponto novo nesta rodada",
      );
      recarregar();
    } catch (error) {
      const mensagem =
        error instanceof ApiError ? error.message : "Não foi possível buscar agora";
      setErroBusca(mensagem);
    } finally {
      setBuscando(false);
    }
  };

  return {
    itens,
    carregando,
    erro,
    buscando,
    erroBusca,
    resumoBusca,
    facetas,
    recarregar,
    remover,
    alternarFaceta,
    buscar,
  };
};
