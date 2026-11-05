"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ApiError } from "@/lib/api";
import {
  assinarSeguir,
  assinarVersaoSeguir,
  lerVersaoSeguir,
} from "@/lib/seguir-contadores";
import type { PerfilPublico } from "@/types/perfil-publico";
import { ERRO_PERFIL_PUBLICO } from "../constants";
import { perfilPublicoService } from "../services/perfil-publico.service";

export const usePerfilPublico = (uid: string) => {
  const versao = useSyncExternalStore(assinarVersaoSeguir, lerVersaoSeguir, () => 0);
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const uidCarregado = useRef<string | null>(null);

  useEffect(() => {
    return assinarSeguir((mudanca) => {
      if (mudanca.uid !== uid) return;
      setPerfil((atual) =>
        atual
          ? {
              ...atual,
              seguidores: Math.max(0, (atual.seguidores ?? 0) + mudanca.delta),
            }
          : atual,
      );
    });
  }, [uid]);

  useEffect(() => {
    let cancelado = false;
    const silencioso = uidCarregado.current === uid;

    const carregar = async () => {
      if (!uid) {
        setNaoEncontrado(true);
        setPerfil(null);
        setCarregando(false);
        return;
      }

      if (!silencioso) {
        setCarregando(true);
        setErro(null);
        setNaoEncontrado(false);
      }

      try {
        const dados = await perfilPublicoService.buscar(uid);
        if (cancelado) return;
        if (!dados) {
          setNaoEncontrado(true);
          setPerfil(null);
          return;
        }
        setPerfil(dados);
        uidCarregado.current = uid;
      } catch (e) {
        if (cancelado || silencioso) return;
        const mensagem = e instanceof ApiError ? e.message : ERRO_PERFIL_PUBLICO;
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
  }, [uid, versao]);

  return { perfil, carregando, naoEncontrado, erro };
};
