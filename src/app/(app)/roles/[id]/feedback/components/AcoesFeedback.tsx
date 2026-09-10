"use client";

import {
  CTA_ENVIANDO,
  CTA_PULAR,
  CTA_SALVAR,
  CTA_VOLTAR,
} from "../constants";
import { EstadoEnviado } from "./EstadoEnviado";
import styles from "../feedback-role.module.css";

type Props = {
  podeEnviar: boolean;
  enviando: boolean;
  enviado: boolean;
  erroEnvio: string | null;
  mostrarPular: boolean;
  onEnviar: () => void;
  onPular: () => void;
  onVoltar: () => void;
};

export const AcoesFeedback = ({
  podeEnviar,
  enviando,
  enviado,
  erroEnvio,
  mostrarPular,
  onEnviar,
  onPular,
  onVoltar,
}: Props) => {
  if (!mostrarPular) {
    return (
      <div className={styles.acoes}>
        <button type="button" className={styles.ctaPrimario} onClick={onVoltar}>
          <span>{CTA_VOLTAR}</span>
          <span className="material-symbols-outlined" aria-hidden>
            arrow_forward
          </span>
        </button>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className={styles.acoes}>
        <EstadoEnviado />
      </div>
    );
  }

  return (
    <div className={styles.acoes}>
      {erroEnvio ? (
        <p className={styles.erroEnvio} role="alert">
          {erroEnvio}
        </p>
      ) : null}
      <button
        type="button"
        className={styles.ctaPrimario}
        disabled={!podeEnviar}
        onClick={onEnviar}
      >
        <span>{enviando ? CTA_ENVIANDO : CTA_SALVAR}</span>
        <span
          className={`material-symbols-outlined ${enviando ? styles.spin : ""}`}
          aria-hidden
        >
          {enviando ? "progress_activity" : "alt_route"}
        </span>
      </button>
      <button
        type="button"
        className={styles.ctaPular}
        aria-label="Pular avaliação por enquanto"
        onClick={onPular}
      >
        {CTA_PULAR}
      </button>
    </div>
  );
};
