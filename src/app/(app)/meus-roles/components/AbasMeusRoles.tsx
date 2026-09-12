"use client";

import type { KeyboardEvent } from "react";
import type { AbaMeusRoles, ContagensMeusRoles } from "@/types/meus-roles";
import { ABAS_MEUS_ROLES } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  aba: AbaMeusRoles;
  contagens: ContagensMeusRoles;
  onSelecionar: (aba: Exclude<AbaMeusRoles, "proximos">) => void;
};

export const AbasMeusRoles = ({ aba, contagens, onSelecionar }: Props) => {
  const onKeyDown = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;
    evento.preventDefault();
    const idx = Math.max(
      0,
      ABAS_MEUS_ROLES.findIndex((item) => item.id === aba),
    );
    const delta = evento.key === "ArrowRight" ? 1 : -1;
    const proxima = ABAS_MEUS_ROLES[(idx + delta + ABAS_MEUS_ROLES.length) % ABAS_MEUS_ROLES.length];
    onSelecionar(proxima.id);
    requestAnimationFrame(() => {
      document.getElementById(`tab-meus-roles-${proxima.id}`)?.focus();
    });
  };

  return (
    <div
      className={styles.trilhas}
      role="tablist"
      aria-label="Filtro de status dos rolês"
      onKeyDown={onKeyDown}
    >
      {ABAS_MEUS_ROLES.map((item) => {
        const selecionada = aba === item.id;
        const n = contagens[item.id];
        return (
          <button
            key={item.id}
            id={`tab-meus-roles-${item.id}`}
            type="button"
            role="tab"
            aria-selected={selecionada}
            aria-controls="painel-meus-roles"
            tabIndex={selecionada || aba === "proximos" && item.id === "confirmados" ? 0 : -1}
            className={selecionada ? `${styles.aba} ${styles.abaAtiva}` : styles.aba}
            onClick={() => onSelecionar(item.id)}
          >
            <span className={styles.abaLabel}>{item.label}</span>
            <span className={styles.abaBadge} aria-label={`${item.label}, ${n} rolês`}>
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
};
