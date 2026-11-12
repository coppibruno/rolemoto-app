"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConquistaCatalogo } from "@/types/conquista";
import { rankingService } from "../services/ranking.service";

const porNome = (itens: ConquistaCatalogo[]) =>
  [...itens].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));

export const usePinosRanking = () => {
  const [pinos, setPinos] = useState<ConquistaCatalogo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setPinos(porNome(await rankingService.listarPinos()));
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
