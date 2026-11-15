"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { ConquistaMinha } from "@/types/conquista";
import { rankingService } from "../services/ranking.service";

const porNome = (itens: ConquistaMinha[]) =>
  [...itens].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));

export const usePinosRanking = () => {
  const { usuario } = useAuth();
  const admin = usuario?.admin === true;
  const [pinos, setPinos] = useState<ConquistaMinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const itens = admin
        ? await rankingService.listarTodosPinos()
        : await rankingService.listarMeusPinos();
      setPinos(porNome(itens));
    } catch {
      setErro("Não deu para carregar os pontos.");
    } finally {
      setCarregando(false);
    }
  }, [admin]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return { pinos, admin, carregando, erro, recarregar: carregar };
};
