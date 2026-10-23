"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { PessoaStory, StoryPublica } from "@/types/story-local";
import { storiesService } from "../services/stories.service";
import { useCapturaFoto } from "./useCapturaFoto";

export const useCarrosselStories = () => {
  const { usuario } = useAuth();
  const [pessoas, setPessoas] = useState<PessoaStory[]>([]);
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [alvoId, setAlvoId] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [inicial, setInicial] = useState<StoryPublica | null>(null);
  const captura = useCapturaFoto(setArquivo);

  const recarregar = useCallback(() => {
    storiesService
      .pessoas()
      .then((dados) => {
        setPessoas(dados.pessoas);
        setErro(false);
      })
      .catch(() => setErro(true));
  }, []);

  useEffect(() => {
    let cancelado = false;
    storiesService
      .pessoas()
      .then((dados) => {
        if (!cancelado) setPessoas(dados.pessoas);
      })
      .catch(() => {
        if (!cancelado) setErro(true);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const euApi = pessoas.find((pessoa) => pessoa.propria);
  const eu: PessoaStory | null = euApi ?? (usuario
    ? {
      uid: usuario.uid,
      apelido: usuario.apelido || usuario.nome,
      fotoUrl: usuario.fotoUrl,
      contagem: 0,
      naoVisto: false,
      propria: true,
    }
    : null);
  const outras = pessoas.filter((pessoa) => !pessoa.propria);

  const abrir = (pessoa: PessoaStory) => {
    if (pessoa.propria && pessoa.contagem === 0) {
      captura.abrir();
      return;
    }
    setInicial(null);
    setAlvoId(pessoa.uid);
  };

  const publicada = (story: StoryPublica) => {
    setArquivo(null);
    setInicial(story);
    setAlvoId(story.autor.uid);
    recarregar();
  };

  const fechar = () => {
    setAlvoId(null);
    setInicial(null);
    recarregar();
  };

  return {
    eu,
    outras,
    erro,
    carregando,
    abrir,
    novaFoto: captura.abrir,
    inputRef: captura.inputRef,
    aoArquivo: captura.aoArquivo,
    erroFoto: captura.erro,
    arquivo,
    descartar: () => setArquivo(null),
    publicada,
    playerAberto: alvoId !== null,
    alvoId,
    inicial,
    fechar,
    recarregar,
    tentarDeNovo: () => {
      setCarregando(true);
      setErro(false);
      storiesService
        .pessoas()
        .then((dados) => setPessoas(dados.pessoas))
        .catch(() => setErro(true))
        .finally(() => setCarregando(false));
    },
  };
};
