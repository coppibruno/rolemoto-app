"use client";

import type { ChangeEvent, RefObject } from "react";
import { BADGE_CAPA, BADGE_CAPA_ORIGINAL } from "../constants";
import styles from "../criar-role.module.css";

type Props = {
  previewUrl: string;
  capaHerdada?: boolean;
  erro?: string;
  desabilitado?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onAbrirSeletor: () => void;
  onSelecionar: (file: File | undefined) => void;
  onRemover: () => void;
};

export const FotoCapa = ({
  previewUrl,
  capaHerdada,
  erro,
  desabilitado,
  inputRef,
  onAbrirSeletor,
  onSelecionar,
  onRemover,
}: Props) => {
  const erroId = "foto-capa-erro";

  const aoMudar = (e: ChangeEvent<HTMLInputElement>) => {
    onSelecionar(e.target.files?.[0]);
    e.target.value = "";
  };

  return (
    <div className={`${styles.cartao} ${erro ? styles.cartaoErro : ""}`}>
      <div className={styles.labelLinha}>
        <span className={styles.label}>
          <span className="material-symbols-outlined" aria-hidden>
            add_photo_alternate
          </span>
          Foto de Capa do Rolê
        </span>
        <span className={styles.hintOpcional}>opcional</span>
      </div>

      {previewUrl ? (
        <div className={styles.previewCapa}>
          <img
            src={previewUrl}
            alt="Foto de capa do rolê"
            className={styles.previewImg}
          />
          <div className={styles.previewBarra}>
            <span className={styles.badgeCapa}>
              {capaHerdada ? BADGE_CAPA_ORIGINAL : BADGE_CAPA}
            </span>
            <button
              type="button"
              className={styles.botaoRemoverCapa}
              onClick={onRemover}
              disabled={desabilitado}
              aria-label="Remover foto"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.dropzone}
          onClick={onAbrirSeletor}
          disabled={desabilitado}
          aria-label="Anexar foto de capa do rolê (opcional)"
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? erroId : undefined}
        >
          <span className={styles.dropzoneIcone} aria-hidden>
            <span className="material-symbols-outlined">two_wheeler</span>
          </span>
          <span className={styles.dropzoneTitulo}>Toque para anexar foto da rota</span>
          <span className={styles.dropzoneHint}>
            Mostre o ponto de encontro ou as curvas da estrada
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className={styles.inputFile}
        onChange={aoMudar}
        disabled={desabilitado}
        aria-label="Anexar foto de capa do rolê"
      />

      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
