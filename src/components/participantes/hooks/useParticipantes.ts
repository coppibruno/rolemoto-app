"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type {
  ParticipanteResumo,
  TipoAlvoParticipantes,
} from "@/types/participante";
import { participantesService } from "../services/participantes.service";

export const useParticipantes = (
  tipo: TipoAlvoParticipantes,
  id: string,
  aberto: boolean,
) => {
  const [itens, setItens] = useState<ParticipanteResumo[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await participantesService.listar(tipo, id);
      setItens(lista.itens);
      setTotal(lista.total);
    } catch (e) {
      setItens([]);
      setTotal(0);
      setErro(
        e instanceof ApiError ? e.message : "Não foi possível carregar a lista",
      );
    } finally {
      setCarregando(false);
    }
  }, [tipo, id]);

  useEffect(() => {
    if (!aberto) return;
    void carregar();
  }, [aberto, carregar]);

  return { itens, total, carregando, erro };
};
