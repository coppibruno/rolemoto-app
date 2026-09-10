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

  const rotulo = previewUrl ? COPY.fotoTrocar : COPY.fotoAdicionar;

  return (
    <section className={`${styles.card} ${styles.cardFoto}`}>
      <div className={styles.fotoBloco}>
        <div className={styles.avatar}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={nome ? `Foto de ${nome}` : "Foto de perfil"}
              className={styles.avatarImg}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className={`material-symbols-outlined ${styles.avatarPlaceholder}`} aria-hidden>
              person
            </span>
          )}
        </div>
        <button
          type="button"
          className={styles.botaoCamera}
          aria-label="Trocar foto de perfil"
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? "foto-erro" : undefined}
          onClick={onAbrirSeletor}
          disabled={desabilitado}
        >
          <span className={styles.botaoCameraIcone}>
            <span className="material-symbols-outlined">photo_camera</span>
          </span>
        </button>
      </div>

      <span className={styles.fotoTitulo}>{COPY.fotoTitulo}</span>
      <p className={styles.fotoSubtitulo}>{COPY.fotoSubtitulo}</p>

      <button
        type="button"
        className={styles.botaoAdicionarFoto}
        onClick={onAbrirSeletor}
        disabled={desabilitado}
      >
        <span className="material-symbols-outlined" aria-hidden>
          add_a_photo
        </span>
        {rotulo}
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
