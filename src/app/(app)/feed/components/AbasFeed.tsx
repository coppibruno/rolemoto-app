"use client";

import type { KeyboardEvent } from "react";
import type { ContagensFeed } from "@/types/feed";
import { ABAS_FEED } from "../constants";
import type { AbaFeed } from "../types";
import styles from "../feed.module.css";

type Props = {
  aba: AbaFeed;
  onChange: (aba: AbaFeed) => void;
  contagens: ContagensFeed | null;
  carregando: boolean;
};

const rotuloContagem = (id: AbaFeed, n: number) => {
  if (id === "roles") return n === 1 ? "1 rolê" : `${n} rolês`;
  if (id === "eventos") return n === 1 ? "1 evento" : `${n} eventos`;
  return n === 1 ? "1 local" : `${n} locais`;
};

export const AbasFeed = ({ aba, onChange, contagens, carregando }: Props) => {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = ABAS_FEED.findIndex((item) => item.id === aba);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onChange(ABAS_FEED[(idx + 1) % ABAS_FEED.length].id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(ABAS_FEED[(idx - 1 + ABAS_FEED.length) % ABAS_FEED.length].id);
    }
  };

  return (
    <div
      className={styles.abas}
      role="tablist"
      aria-label="Tipo de conteúdo do feed"
      aria-live="polite"
      onKeyDown={onKeyDown}
    >
      {ABAS_FEED.map((item) => {
        const ativo = aba === item.id;
        const n = contagens?.[item.id];
        const textoContagem =
          n === undefined || (carregando && contagens === null) ? "—" : `(${n})`;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={ativo}
            aria-controls={item.painelId}
            tabIndex={ativo ? 0 : -1}
            className={ativo ? styles.abaAtiva : styles.aba}
            onClick={() => onChange(item.id)}
          >
            <span className={styles.abaLabel}>
              <span className="material-symbols-outlined" aria-hidden>
                {item.icone}
              </span>
              <span>{item.label}</span>
            </span>
            <span
              className={ativo ? styles.abaContadorAtivo : styles.abaContador}
              aria-label={
                n === undefined ? undefined : rotuloContagem(item.id, n)
              }
            >
              {textoContagem}
            </span>
          </button>
        );
      })}
    </div>
  );
};
