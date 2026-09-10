"use client";

import { FotoPerfil } from "./FotoPerfil";
import styles from "../perfil.module.css";
import type { RefObject } from "react";

type Props = {
  nome: string;
  apelido: string;
  previewUrl: string;
  erroFoto?: string;
  desabilitado?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onAbrirSeletor: () => void;
  onSelecionarFoto: (file: File | undefined) => void;
};

export const CartaoIdentidade = ({
  nome,
  apelido,
  previewUrl,
  erroFoto,
  desabilitado,
  inputRef,
  onAbrirSeletor,
  onSelecionarFoto,
}: Props) => {
  return (
    <section className={styles.cartao}>
      <div className={styles.cartaoGlow} />
      <FotoPerfil
        previewUrl={previewUrl}
        nome={nome}
        erro={erroFoto}
        desabilitado={desabilitado}
        inputRef={inputRef}
        onAbrirSeletor={onAbrirSeletor}
        onSelecionar={onSelecionarFoto}
      />
      <h1 className={styles.nomeExibicao}>{nome || "Nome completo"}</h1>
      <p className={styles.apelidoExibicao}>@{apelido || "apelido"}</p>
    </section>
  );
};
