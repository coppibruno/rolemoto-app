"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFocoModal } from "@/hooks/useFocoModal";
import { useTrilhoFotos } from "./useTrilhoFotos";
import styles from "./visualizador-fotos.module.css";

type Props = {
  fotos: string[];
  indiceInicial: number;
  rotulo: string;
  onFechar: () => void;
};

export const DialogoFotos = ({ fotos, indiceInicial, rotulo, onFechar }: Props) => {
  const fecharRef = useRef(onFechar);
  fecharRef.current = onFechar;
  const fechar = useCallback(() => fecharRef.current(), []);
  const focoRef = useFocoModal(fechar);
  const { trilhoRef, indice, aoRolar, irPara } = useTrilhoFotos(fotos.length, indiceInicial);
  const varias = fotos.length > 1;

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  useEffect(() => {
    const onKey = (evento: KeyboardEvent) => {
      if (evento.key === "ArrowRight") {
        evento.preventDefault();
        irPara(indice + 1);
      }
      if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        irPara(indice - 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [indice, irPara]);

  return createPortal(
    <div className={styles.overlay}>
      <div
        ref={focoRef}
        className={styles.dialogo}
        role="dialog"
        aria-modal="true"
        aria-label={rotulo}
      >
        <button
          type="button"
          className={styles.fechar}
          onClick={fechar}
          aria-label="Fechar"
          data-foco-inicial
        >
          <span className="material-symbols-outlined" aria-hidden>
            close
          </span>
        </button>
        <div
          ref={trilhoRef}
          className={styles.trilho}
          onScroll={varias ? aoRolar : undefined}
          aria-roledescription="carrossel"
        >
          {fotos.map((url, i) => (
            <div className={styles.slide} key={`${i}-${url}`}>
              <img
                src={url}
                alt={`${rotulo}, foto ${i + 1} de ${fotos.length}`}
                className={styles.foto}
                draggable={false}
              />
            </div>
          ))}
        </div>
        {varias ? (
          <>
            <button
              type="button"
              className={`${styles.seta} ${styles.setaEsq}`}
              aria-label="Foto anterior"
              disabled={indice === 0}
              onClick={() => irPara(indice - 1)}
            >
              <span className="material-symbols-outlined" aria-hidden>
                chevron_left
              </span>
            </button>
            <button
              type="button"
              className={`${styles.seta} ${styles.setaDir}`}
              aria-label="Próxima foto"
              disabled={indice === fotos.length - 1}
              onClick={() => irPara(indice + 1)}
            >
              <span className="material-symbols-outlined" aria-hidden>
                chevron_right
              </span>
            </button>
            <p className={styles.contador} aria-live="polite">
              {indice + 1} / {fotos.length}
            </p>
          </>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};
