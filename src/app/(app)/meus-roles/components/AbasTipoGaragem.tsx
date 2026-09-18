"use client";

import type { KeyboardEvent } from "react";
import type { AbaTipoGaragem, ContagensTipoGaragem } from "@/types/meus-roles";
import { ABAS_TIPO_GARAGEM } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  aba: AbaTipoGaragem;
  contagens: ContagensTipoGaragem;
  onSelecionar: (aba: AbaTipoGaragem) => void;
};

export const AbasTipoGaragem = ({ aba, contagens, onSelecionar }: Props) => {
  const onKeyDown = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;
    evento.preventDefault();
    const idx = ABAS_TIPO_GARAGEM.findIndex((item) => item.id === aba);
    const delta = evento.key === "ArrowRight" ? 1 : -1;
    const proxima =
      ABAS_TIPO_GARAGEM[
        (idx + delta + ABAS_TIPO_GARAGEM.length) % ABAS_TIPO_GARAGEM.length
      ];
    onSelecionar(proxima.id);
    requestAnimationFrame(() => {
      document.getElementById(`tab-tipo-garagem-${proxima.id}`)?.focus();
    });
  };

  return (
    <div
      className={styles.abasTipo}
      role="tablist"
      aria-label="Tipo na garagem"
      onKeyDown={onKeyDown}
    >
      {ABAS_TIPO_GARAGEM.map((item) => {
        const selecionada = aba === item.id;
        const n = contagens[item.id];
        return (
          <button
            key={item.id}
            id={`tab-tipo-garagem-${item.id}`}
            type="button"
            role="tab"
            aria-selected={selecionada}
            tabIndex={selecionada ? 0 : -1}
            className={
              selecionada
                ? `${styles.abaTipo} ${styles.abaTipoAtiva}`
                : styles.abaTipo
            }
            onClick={() => onSelecionar(item.id)}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {item.icone}
            </span>
            <span className={styles.abaTipoLabel}>{item.label}</span>
            <span className={styles.abaTipoBadge}>{n}</span>
          </button>
        );
      })}
    </div>
  );
};
