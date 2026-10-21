"use client";

import type { ChangeEvent, RefObject } from "react";
import { COPY } from "../constants";
import styles from "../primeiro-acesso.module.css";

type Props = {
  previewUrl: string;
  nome: string;
  erro?: string;
  desabilitado?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onAbrirSeletor: () => void;
  onSelecionar: (file: File | undefined) => void;
};

export const BlocoFotoPerfil = ({
  previewUrl,
  nome,
  erro,
  desabilitado,
  inputRef,
  onAbrirSeletor,
  onSelecionar,
}: Props) => {
  const aoMudar = (e: ChangeEvent<HTMLInputElement>) => {
    onSelecionar(e.target.files?.[0]);
    e.target.value = "";
  };

  return (
    <section className={styles.fotoBloco}>
      <button
        type="button"
        className={styles.avatar}
        aria-label={previewUrl ? COPY.fotoTrocar : COPY.fotoAdicionar}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? "foto-erro" : undefined}
        onClick={onAbrirSeletor}
        disabled={desabilitado}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={nome ? `Foto de ${nome}` : "Foto de perfil"}
            className={styles.avatarImg}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={`material-symbols-outlined ${styles.avatarPlaceholder}`} aria-hidden>
            add_a_photo
          </span>
        )}
      </button>

      <button
        type="button"
        className={styles.botaoFoto}
        onClick={onAbrirSeletor}
        disabled={desabilitado}
      >
        {previewUrl ? COPY.fotoTrocar : COPY.fotoAdicionar}
        {previewUrl ? null : <span className={styles.opcional}>· {COPY.fotoOpcional}</span>}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className={styles.inputFile}
        onChange={aoMudar}
        disabled={desabilitado}
      />

      {erro ? (
        <p id="foto-erro" className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </section>
  );
};
