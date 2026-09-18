"use client";

import type { ChangeEvent, RefObject } from "react";
import { BADGE_PREVIA } from "../constants";
import styles from "../criar-evento.module.css";

type Props = {
  previewUrl: string;
  erro?: string;
  desabilitado?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onAbrirSeletor: () => void;
  onSelecionar: (file: File | undefined) => void;
  onRemover: () => void;
};

export const FotoFlyer = ({
  previewUrl,
  erro,
  desabilitado,
  inputRef,
  onAbrirSeletor,
  onSelecionar,
  onRemover,
}: Props) => {
  const erroId = "flyer-evento-erro";

  const aoMudar = (e: ChangeEvent<HTMLInputElement>) => {
    onSelecionar(e.target.files?.[0]);
    e.target.value = "";
  };

  return (
    <div className={styles.campo}>
      <div className={styles.labelLinha}>
        <span className={styles.label}>
          Flyer ou Foto de Capa <span className={styles.obrigatorio}>*</span>
        </span>
        <span className={styles.hintOpcional}>Formato 16:9 ou banner</span>
      </div>

      <div className={`${styles.flyer} ${erro ? styles.cartaoErro : ""}`}>
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Prévia do flyer do evento"
              className={styles.previewImg}
            />
            <div className={styles.previewGradiente} aria-hidden />
            <span className={styles.badgePrevia}>
              <span className="material-symbols-outlined" aria-hidden>
                photo_camera
              </span>
              {BADGE_PREVIA}
            </span>
            <button
              type="button"
              className={styles.botaoRemoverFlyer}
              onClick={(e) => {
                e.stopPropagation();
                onRemover();
              }}
              disabled={desabilitado}
              aria-label="Remover flyer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <button
              type="button"
              className={styles.botaoAlterar}
              onClick={onAbrirSeletor}
              disabled={desabilitado}
            >
              <span className="material-symbols-outlined" aria-hidden>
                add_photo_alternate
              </span>
              Alterar Imagem
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.dropzone}
            onClick={onAbrirSeletor}
            disabled={desabilitado}
            aria-label="Anexar flyer ou foto de capa"
            aria-invalid={Boolean(erro)}
            aria-describedby={erro ? erroId : undefined}
          >
            <span className={styles.dropzoneIcone} aria-hidden>
              <span className="material-symbols-outlined">add_photo_alternate</span>
            </span>
            <span className={styles.dropzoneTitulo}>Toque para anexar o flyer</span>
            <span className={styles.dropzoneHint}>Formato 16:9 ou banner</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className={styles.inputFile}
        onChange={aoMudar}
        disabled={desabilitado}
        aria-label="Anexar flyer ou foto de capa"
      />

      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
