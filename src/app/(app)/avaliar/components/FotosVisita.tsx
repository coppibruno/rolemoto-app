"use client";

import type { FotoPendente } from "../hooks/useFotosVisita";
import {
  CTA_ANEXAR,
  LABEL_FOTOS,
  LABEL_FOTOS_LIMITE,
  LIMITE_FOTOS,
} from "../constants";
import styles from "../avaliar.module.css";

type Props = {
  fotos: FotoPendente[];
  urlsRemotas?: string[];
  podeAnexar: boolean;
  erroFoto: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onAnexar: (lista: FileList | null) => void;
  onRemover: (id: string) => void;
  onRemoverRemota?: (url: string) => void;
  onAbrirSeletor: () => void;
};

export const FotosVisita = ({
  fotos,
  urlsRemotas = [],
  podeAnexar,
  erroFoto,
  inputRef,
  onAnexar,
  onRemover,
  onRemoverRemota,
  onAbrirSeletor,
}: Props) => {
  return (
    <section className={styles.blocoFotos}>
      <div className={styles.blocoTopo}>
        <h3 className={styles.blocoTitulo}>
          <span className="material-symbols-outlined" aria-hidden>
            photo_camera
          </span>
          {LABEL_FOTOS}
        </h3>
        <span className={styles.contador}>{LABEL_FOTOS_LIMITE}</span>
      </div>
      <div className={styles.gridFotos}>
        {urlsRemotas.map((url, indice) => (
          <div key={url} className={styles.slotFoto}>
            <img src={url} alt="" className={styles.slotFotoImg} />
            {onRemoverRemota ? (
              <button
                type="button"
                className={styles.botaoRemoverFoto}
                aria-label={`Remover foto ${indice + 1}`}
                onClick={() => onRemoverRemota(url)}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  close
                </span>
              </button>
            ) : null}
          </div>
        ))}
        {fotos.map((foto, indice) => (
          <div key={foto.id} className={styles.slotFoto}>
            <img
              src={foto.previewUrl}
              alt=""
              className={styles.slotFotoImg}
            />
            <button
              type="button"
              className={styles.botaoRemoverFoto}
              aria-label={`Remover foto ${indice + 1}`}
              onClick={() => onRemover(foto.id)}
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
            aria-label={`Anexar foto, ${fotos.length + urlsRemotas.length} de ${LIMITE_FOTOS}`}
          >
            <span className="material-symbols-outlined" aria-hidden>
              add_a_photo
            </span>
            {CTA_ANEXAR}
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className={styles.inputFile}
        onChange={(e) => {
          onAnexar(e.target.files);
          e.target.value = "";
        }}
      />
      {erroFoto ? (
        <p className={styles.erroFoto} role="alert">
          {erroFoto}
        </p>
      ) : null}
    </section>
  );
};
