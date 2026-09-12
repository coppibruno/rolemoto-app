"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { perfilService } from "../services/perfil.service";

const MENSAGEM_GENERICA = "Não foi possível excluir a conta. Tente de novo.";

export const useExcluirConta = () => {
  const { logout } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const excluindoRef = useRef(false);

  useEffect(() => {
    excluindoRef.current = excluindo;
  }, [excluindo]);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  const abrir = useCallback(() => {
    if (excluindoRef.current) return;
    setErro(null);
    setAberto(true);
  }, []);

  const fechar = useCallback(() => {
    if (excluindoRef.current) return;
    setAberto(false);
    setErro(null);
  }, []);

  const confirmar = async () => {
    if (excluindoRef.current) return;
    setExcluindo(true);
    setErro(null);
    try {
      await perfilService.excluir();
      await logout();
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError && e.status === 404) {
        await logout();
        return;
      }
      setErro(e instanceof ApiError ? e.message : MENSAGEM_GENERICA);
    } finally {
      setExcluindo(false);
    }
  };

  return { aberto, excluindo, erro, abrir, fechar, confirmar };
};
