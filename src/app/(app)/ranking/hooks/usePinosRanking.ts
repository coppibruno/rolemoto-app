"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConquistaMinha } from "@/types/conquista";
import { rankingService } from "../services/ranking.service";

const porNome = (itens: ConquistaMinha[]) =>
  [...itens].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));

export const usePinosRanking = () => {
  const [pinos, setPinos] = useState<ConquistaMinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setPinos(porNome(await rankingService.listarMeusPinos()));
    } catch {
      setErro("Não deu para carregar os pontos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return { pinos, carregando, erro, recarregar: carregar };
};
