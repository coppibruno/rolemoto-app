"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { PerfilPublico } from "@/types/perfil-publico";
import { ERRO_PERFIL_PUBLICO } from "../constants";
import { perfilPublicoService } from "../services/perfil-publico.service";

export const usePerfilPublico = (uid: string) => {
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      if (!uid) {
        setNaoEncontrado(true);
        setPerfil(null);
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro(null);
      setNaoEncontrado(false);
      try {
        const dados = await perfilPublicoService.buscar(uid);
        if (cancelado) return;
        if (!dados) {
          setNaoEncontrado(true);
          setPerfil(null);
          return;
        }
        setPerfil(dados);
      } catch (e) {
        if (cancelado) return;
        const mensagem =
          e instanceof ApiError ? e.message : ERRO_PERFIL_PUBLICO;
        setErro(mensagem);
        setPerfil(null);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [uid]);

  return { perfil, carregando, naoEncontrado, erro };
};
