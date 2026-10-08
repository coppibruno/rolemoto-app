"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import { MODAL_COMPARTILHAR_TELEMETRIA as TEXTO } from "../constants";
import styles from "./modal-compartilhar-telemetria.module.css";

type Props = {
  previewUrl: string | null;
  ocupado: boolean;
  onCompartilhar: () => void;
  onSalvar: () => void;
  onFechar: () => void;
};

export const ModalCompartilharTelemetria = ({
  previewUrl,
  ocupado,
  onCompartilhar,
  onSalvar,
  onFechar,
}: Props) => {
  const cartaoRef = useFocoModal(onFechar);
  const bloqueado = ocupado || !previewUrl;

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        ref={cartaoRef}
        className={styles.cartao}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-compartilhar"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titulo-modal-compartilhar" className={styles.titulo}>
          {TEXTO.titulo}
        </h2>
        <div className={styles.preview} aria-busy={!previewUrl}>
          {previewUrl ? (
            <img src={previewUrl} alt={TEXTO.altPreview} className={styles.imagem} />
          ) : (
            <span className={styles.preparando}>{TEXTO.preparando}</span>
          )}
        </div>
        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.botaoPrimario}
            onClick={onCompartilhar}
            disabled={bloqueado}
            data-foco-inicial
          >
            <span className="material-symbols-outlined" aria-hidden>
              share
            </span>
            {TEXTO.compartilhar}
          </button>
          <button
            type="button"
            className={styles.botaoContorno}
            onClick={onSalvar}
            disabled={bloqueado}
          >
            <span className="material-symbols-outlined" aria-hidden>
              download
            </span>
            {TEXTO.salvar}
          </button>
          <button type="button" className={styles.botaoSecundario} onClick={onFechar}>
            {TEXTO.fechar}
          </button>
        </div>
      </div>
    </div>
  );
};
