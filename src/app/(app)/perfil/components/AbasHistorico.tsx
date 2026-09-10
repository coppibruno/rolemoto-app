"use client";

import type { KeyboardEvent } from "react";
import type { AbaHistorico, HistoricoPistas } from "@/types/historico-pistas";
import { ABAS_HISTORICO, ariaBadgeAba } from "../constants";
import styles from "../historico-pistas.module.css";

type Props = {
  aba: AbaHistorico;
  onMudar: (aba: AbaHistorico) => void;
  contagens: HistoricoPistas["contagens"] | null;
  carregando: boolean;
};

export const AbasHistorico = ({ aba, onMudar, contagens, carregando }: Props) => {
  const onKeyDown = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;
    evento.preventDefault();
    const idx = ABAS_HISTORICO.findIndex((item) => item.id === aba);
    const delta = evento.key === "ArrowRight" ? 1 : -1;
    const total = ABAS_HISTORICO.length;
    const proxima = ABAS_HISTORICO[(idx + delta + total) % total];
    onMudar(proxima.id);
    requestAnimationFrame(() => {
      document.getElementById(`tab-historico-${proxima.id}`)?.focus();
    });
  };

  return (
    <div
      className={styles.trilhas}
      role="tablist"
      aria-label="Histórico de pistas"
      onKeyDown={onKeyDown}
    >
      {ABAS_HISTORICO.map((item) => {
        const selecionada = aba === item.id;
        const n = contagens?.[item.id];
        return (
          <button
            key={item.id}
            id={`tab-historico-${item.id}`}
            type="button"
            role="tab"
            aria-selected={selecionada}
            aria-controls="painel-historico"
            tabIndex={selecionada ? 0 : -1}
            className={selecionada ? `${styles.aba} ${styles.abaAtiva}` : styles.aba}
            onClick={() => onMudar(item.id)}
          >
            <span className={styles.abaLabel}>{item.label}</span>
            {carregando || n === undefined ? null : (
              <span className={styles.abaBadge} aria-label={ariaBadgeAba(item.label, n)}>
                {n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
