"use client";

import { useEffect, useRef } from "react";
import type { NotaFeedback } from "@/types/usuario-role-feedback";
import type { NotaFormulario } from "../hooks/useFormularioFeedback";
import {
  ariaEstrela,
  LABEL_NOTA,
  META_NOTA,
  META_NOTA_VAZIA,
} from "../constants";
import styles from "../feedback-role.module.css";

type Props = {
  nota: NotaFormulario;
  onNota: (nota: NotaFeedback) => void;
  focarPrimeira: boolean;
};

const ESTRELAS: NotaFeedback[] = [1, 2, 3, 4, 5];

const classeTom = (tom: string): string => {
  if (tom === "erro") return styles.tomErro;
  if (tom === "alerta") return styles.tomAlerta;
  if (tom === "bom") return styles.tomBom;
  if (tom === "epico") return styles.tomEpico;
  return styles.tomVazio;
};

export const SeletorNota = ({ nota, onNota, focarPrimeira }: Props) => {
  const primeiraRef = useRef<HTMLButtonElement>(null);
  const meta = nota === 0 ? META_NOTA_VAZIA : META_NOTA[nota];

  useEffect(() => {
    if (focarPrimeira) {
      primeiraRef.current?.focus();
    }
  }, [focarPrimeira]);

  return (
    <section className={styles.blocoNota}>
      <span className={styles.blocoNotaLabel}>{LABEL_NOTA}</span>
      <div
        className={styles.estrelas}
        role="radiogroup"
        aria-label="Nota da rota"
      >
        {ESTRELAS.map((valor) => {
          const preenchida = nota >= valor;
          return (
            <button
              key={valor}
              ref={valor === 1 ? primeiraRef : undefined}
              type="button"
              role="radio"
              aria-checked={nota === valor}
              aria-label={ariaEstrela(valor)}
              className={`${styles.estrela} ${preenchida ? styles.estrelaPreenchida : ""}`}
              onClick={() => onNota(valor)}
            >
              <span className="material-symbols-outlined" aria-hidden>
                star
              </span>
            </button>
          );
        })}
      </div>
      <div className={styles.metaNota}>
        <p className={`${styles.metaTitulo} ${classeTom(meta.tom)}`}>
          {meta.titulo}
        </p>
        <p className={styles.metaSubtitulo}>{meta.subtitulo}</p>
      </div>
    </section>
  );
};
