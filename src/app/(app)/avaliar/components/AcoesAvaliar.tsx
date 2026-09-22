"use client";

import {
  CTA_CANCELAR,
  CTA_PUBLICAR,
  CTA_PUBLICANDO,
  CTA_SALVAR,
  CTA_SALVANDO,
  CTA_VOLTAR_FEED,
} from "../constants";
import { EstadoEnviado } from "./EstadoEnviado";
import styles from "../avaliar.module.css";

type Props = {
  podeEnviar: boolean;
  enviando: boolean;
  enviado: boolean;
  erroEnvio: string | null;
  mostrarForm: boolean;
  modoEdicao?: boolean;
  onEnviar: () => void;
  onCancelar: () => void;
  onVoltarFeed: () => void;
};

export const AcoesAvaliar = ({
  podeEnviar,
  enviando,
  enviado,
  erroEnvio,
  mostrarForm,
  modoEdicao = false,
  onEnviar,
  onCancelar,
  onVoltarFeed,
}: Props) => {
  if (!mostrarForm) {
    return (
      <div className={styles.acoes}>
        <button
          type="button"
          className={styles.ctaPrimario}
          onClick={onVoltarFeed}
        >
          <span>{CTA_VOLTAR_FEED}</span>
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
        <span>
          {enviando
            ? modoEdicao
              ? CTA_SALVANDO
              : CTA_PUBLICANDO
            : modoEdicao
              ? CTA_SALVAR
              : CTA_PUBLICAR}
        </span>
        <span
          className={`material-symbols-outlined ${enviando ? styles.spin : ""}`}
          aria-hidden
        >
          {enviando ? "progress_activity" : "send"}
        </span>
      </button>
      <button
        type="button"
        className={styles.ctaSecundario}
        onClick={onCancelar}
      >
        {CTA_CANCELAR}
      </button>
    </div>
  );
};
