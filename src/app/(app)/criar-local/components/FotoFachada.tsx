"use client";

import type { ChangeEvent, MouseEvent, RefObject } from "react";
import styles from "../criar-local.module.css";

type Props = {
  previewUrl: string;
  erro?: string;
  desabilitado?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onAbrirSeletor: () => void;
  onSelecionar: (file: File | undefined) => void;
  onRemover: () => void;
};

export const FotoFachada = ({
  previewUrl,
  erro,
  desabilitado,
  inputRef,
  onAbrirSeletor,
  onSelecionar,
  onRemover,
}: Props) => {
  const erroId = "foto-fachada-erro";

  const aoMudar = (e: ChangeEvent<HTMLInputElement>) => {
    onSelecionar(e.target.files?.[0]);
    e.target.value = "";
  };

  const aoRemover = (e: MouseEvent) => {
    e.stopPropagation();
    onRemover();
  };

  return (
    <div className={`${styles.cartao} ${erro ? styles.cartaoErro : ""}`}>
      <div className={styles.labelLinha}>
        <span className={styles.label}>Foto de Fachada / Pátio</span>
        <span className={styles.hintOpcional}>Recomendado</span>
      </div>

      {previewUrl ? (
        <div className={styles.previewFachada}>
          <img
            src={previewUrl}
            alt="Foto de fachada do local"
            className={styles.previewImg}
          />
          <div className={styles.previewOverlay}>
            <button
              type="button"
              className={styles.botaoAlterarFoto}
              onClick={onAbrirSeletor}
              disabled={desabilitado}
            >
              <span className="material-symbols-outlined" aria-hidden>
                add_a_photo
              </span>
              Alterar / Subir Imagem
            </button>
          </div>
          <button
            type="button"
            className={styles.botaoRemoverFoto}
            onClick={aoRemover}
            disabled={desabilitado}
            aria-label="Remover foto de fachada"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={styles.dropzone}
          onClick={onAbrirSeletor}
          disabled={desabilitado}
          aria-label="Anexar foto de fachada ou pátio"
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? erroId : undefined}
        >
          <span className={`material-symbols-outlined ${styles.dropzoneIcone}`} aria-hidden>
            add_a_photo
          </span>
          <span className={styles.dropzoneTitulo}>
            Toque para anexar a foto de fachada
          </span>
          <span className={styles.dropzoneHint}>Recomendado</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className={styles.inputFile}
        onChange={aoMudar}
        disabled={desabilitado}
        aria-label="Anexar foto de fachada ou pátio"
      />

      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
