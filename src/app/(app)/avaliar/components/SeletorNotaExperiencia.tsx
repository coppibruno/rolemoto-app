"use client";

import { useEffect, useRef } from "react";
import type { NotaAvaliacao } from "@/types/avaliacao-experiencia";
import type { NotaFormulario } from "../hooks/useFormularioAvaliacao";
import {
  ariaEstrela,
  LABEL_NOTA,
  META_NOTA,
  META_NOTA_VAZIA,
} from "../constants";
import styles from "../avaliar.module.css";

type Props = {
  nota: NotaFormulario;
  onNota: (nota: NotaAvaliacao) => void;
  focarPrimeira: boolean;
};

const ESTRELAS: NotaAvaliacao[] = [1, 2, 3, 4, 5];

const classeTom = (tom: string): string => {
  if (tom === "erro") return styles.tomErro;
  if (tom === "alerta") return styles.tomAlerta;
  if (tom === "bom") return styles.tomBom;
  if (tom === "epico") return styles.tomEpico;
  return styles.tomVazio;
};

export const SeletorNotaExperiencia = ({
  nota,
  onNota,
  focarPrimeira,
}: Props) => {
  const primeiraRef = useRef<HTMLButtonElement>(null);
  const meta = nota === 0 ? META_NOTA_VAZIA : META_NOTA[nota];

  useEffect(() => {
    if (focarPrimeira) primeiraRef.current?.focus();
  }, [focarPrimeira]);

  return (
    <section className={styles.blocoNota}>
      <span className={styles.blocoNotaLabel}>{LABEL_NOTA}</span>
      <div
        className={styles.estrelas}
        role="radiogroup"
        aria-label="Nota da experiência"
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
      <div className={styles.pillNota}>
        <span className={`${styles.pillNumero} ${classeTom(meta.tom)}`}>
          {nota === 0 ? "—" : String(nota)}
        </span>
        <span className={styles.pillSeparador} aria-hidden />
        <span className={styles.pillLabel}>{meta.label}</span>
      </div>
    </section>
  );
};
