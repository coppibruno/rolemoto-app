"use client";

import type { ChangeEvent, RefObject } from "react";
import styles from "../perfil.module.css";

type Props = {
  previewUrl: string;
  nome: string;
  erro?: string;
  desabilitado?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onAbrirSeletor: () => void;
  onSelecionar: (file: File | undefined) => void;
};

export const FotoPerfil = ({
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
    <div className={styles.fotoBloco}>
      <div className={styles.avatarAnel}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={nome ? `Foto de ${nome}` : "Foto de perfil"}
            className={styles.avatarImagem}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={styles.avatarPlaceholder} aria-hidden>
            <span className="material-symbols-outlined">person</span>
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
    </div>
  );
};
