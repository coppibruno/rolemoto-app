"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import type { EventoDetalhe } from "@/types/evento";
import { ERRO_CARREGAR, ERRO_EVENTO_INDISPONIVEL } from "../constants";
import { eventoDetalheService } from "../services/evento-detalhe.service";

export const useDetalheEvento = (id: string) => {
  const router = useRouter();
  const [evento, setEvento] = useState<EventoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    eventoDetalheService
      .buscar(id)
      .then((dados) => {
        if (cancelado) return;
        // Série: id antigo resolveu para a ocorrência viva — alinha a URL.
        if (dados.id && dados.id !== id) {
          router.replace(`/eventos/${encodeURIComponent(dados.id)}`);
        }
        setEvento(dados);
      })
      .catch((e) => {
        if (cancelado) return;
        setEvento(null);
        setErro(
          e instanceof ApiError && e.status === 404
            ? ERRO_EVENTO_INDISPONIVEL
            : e instanceof ApiError
              ? e.message
              : ERRO_CARREGAR,
        );
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id, versao, router]);

  return { evento, carregando, erro, recarregar: () => setVersao((atual) => atual + 1) };
};
