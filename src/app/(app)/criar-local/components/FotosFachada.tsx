"use client";

import type { ChangeEvent, RefObject } from "react";
import { LIMITE_FOTOS_LOCAL } from "@/lib/fotos-local";
import type { FotoPendente } from "../hooks/useFotosFachada";
import styles from "../criar-local.module.css";

type Props = {
  fotos: FotoPendente[];
  podeAnexar: boolean;
  erro?: string;
  desabilitado?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onAbrirSeletor: () => void;
  onAdicionar: (arquivos: readonly File[]) => void;
  onRemover: (id: string) => void;
};

export const FotosFachada = ({
  fotos,
  podeAnexar,
  erro,
  desabilitado,
  inputRef,
  onAbrirSeletor,
  onAdicionar,
  onRemover,
}: Props) => {
  const erroId = "fotos-fachada-erro";

  const aoMudar = (e: ChangeEvent<HTMLInputElement>) => {
    const lista = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    onAdicionar(lista);
  };

  return (
    <div className={`${styles.cartao} ${erro ? styles.cartaoErro : ""}`}>
      <div className={styles.labelLinha}>
        <span className={styles.label}>Fotos do local</span>
        <span className={styles.hintOpcional}>
          {fotos.length}/{LIMITE_FOTOS_LOCAL} · recomendado
        </span>
      </div>

      {fotos.length === 0 ? (
        <button
          type="button"
          className={styles.dropzone}
          onClick={onAbrirSeletor}
          disabled={desabilitado}
          aria-label="Anexar fotos do local"
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? erroId : undefined}
        >
          <span className={`material-symbols-outlined ${styles.dropzoneIcone}`} aria-hidden>
            add_a_photo
          </span>
          <span className={styles.dropzoneTitulo}>Toque para anexar fotos</span>
          <span className={styles.dropzoneHint}>Até 5. A primeira vira a capa</span>
        </button>
      ) : (
        <div className={styles.gradeFotos}>
          {fotos.map((foto, indice) => (
            <div key={foto.id} className={styles.slotFoto}>
              <img src={foto.previewUrl} alt="" className={styles.slotFotoImg} />
              {indice === 0 ? <span className={styles.seloCapa}>Capa</span> : null}
              <button
                type="button"
                className={styles.botaoRemoverMini}
                aria-label={`Remover foto ${indice + 1}`}
                onClick={() => onRemover(foto.id)}
                disabled={desabilitado}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  close
                </span>
              </button>
            </div>
          ))}
          {podeAnexar ? (
            <button
              type="button"
              className={styles.slotAnexar}
              onClick={onAbrirSeletor}
              disabled={desabilitado}
              aria-label={`Adicionar foto, ${fotos.length} de ${LIMITE_FOTOS_LOCAL}`}
            >
              <span className="material-symbols-outlined" aria-hidden>
                add_a_photo
              </span>
              Adicionar
            </button>
          ) : null}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className={styles.inputFile}
        onChange={aoMudar}
        disabled={desabilitado}
        aria-label="Anexar fotos do local"
      />

      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
