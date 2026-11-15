"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { Afiliado } from "@/types/afiliado";
import { afiliadosService } from "../services/afiliados.service";

export const useAfiliados = () => {
  const [itens, setItens] = useState<Afiliado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [erroCriar, setErroCriar] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setItens(await afiliadosService.listar());
    } catch {
      setErro("Não deu para carregar os links.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const criar = async (codigo: string, nome: string): Promise<boolean> => {
    if (criando) return false;
    setCriando(true);
    setErroCriar(null);
    try {
      const novo = await afiliadosService.criar(codigo, nome);
      setItens((atuais) => [novo, ...atuais]);
      return true;
    } catch (falha) {
      setErroCriar(falha instanceof ApiError ? falha.message : "Não deu para criar o link.");
      return false;
    } finally {
      setCriando(false);
    }
  };

  return { itens, carregando, erro, criando, erroCriar, recarregar: carregar, criar };
};
