"use client";

import { useRef } from "react";
import { OPCOES_QUANDO } from "../constants";
import { formatarDataCurta } from "../formatar-horario";
import type { FiltroQuando } from "../types";
import styles from "../feed.module.css";

type Props = {
  valor: FiltroQuando | null;
  onAlternar: (valor: Exclude<FiltroQuando, { tipo: "data" }>) => void;
  onEscolherData: (iso: string) => void;
  onLimparData: () => void;
};

export const FiltrosData = ({
  valor,
  onAlternar,
  onEscolherData,
  onLimparData,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dataAtiva = valor && typeof valor === "object" ? valor.iso : "";

  const aoClicarData = () => {
    if (dataAtiva) {
      onLimparData();
      return;
    }
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  return (
    <div className={styles.chipsGrupo} role="radiogroup" aria-label="Quando">
      {OPCOES_QUANDO.map((opcao) => {
        const ativo = valor === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            className={`${styles.chip} ${ativo ? styles.chipAtivo : ""}`}
            onClick={() => onAlternar(opcao.valor)}
          >
            {opcao.label}
          </button>
        );
      })}
      <button
        type="button"
        role="radio"
        aria-checked={Boolean(dataAtiva)}
        aria-label={
          dataAtiva ? `Data ${formatarDataCurta(dataAtiva)}, toque para limpar` : "Escolher data"
        }
        className={`${styles.chip} ${dataAtiva ? styles.chipAtivo : ""}`}
        onClick={aoClicarData}
      >
        <span className="material-symbols-outlined" aria-hidden>
          calendar_month
        </span>
        {dataAtiva ? formatarDataCurta(dataAtiva) : "Data"}
      </button>
      <input
        ref={inputRef}
        type="date"
        className={styles.inputData}
        value={dataAtiva}
        onChange={(e) => {
          if (e.target.value) onEscolherData(e.target.value);
        }}
        aria-label="Selecionar data"
        tabIndex={-1}
      />
    </div>
  );
};
