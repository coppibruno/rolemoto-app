"use client";

import type { HorarioDiaForm } from "@/types/local";
import type { OpcaoDiaSemana } from "@/lib/horario-local";
import styles from "../criar-local.module.css";

type Props = {
  opcao: OpcaoDiaSemana;
  dia: HorarioDiaForm;
  desabilitado?: boolean;
  onChange: (patch: Partial<HorarioDiaForm>) => void;
};

export const LinhaHorarioDia = ({ opcao, dia, desabilitado, onChange }: Props) => {
  const idAbertura = `hora-abertura-${dia.dia}`;
  const idFechamento = `hora-fechamento-${dia.dia}`;

  return (
    <div className={styles.linhaDia}>
      <div className={styles.linhaDiaTopo}>
        <span className={styles.linhaDiaNome}>{opcao.label}</span>
        <button
          type="button"
          className={`${styles.botaoDiaStatus} ${
            dia.fechado ? styles.botaoDiaFechado : styles.botaoDiaAberto
          }`}
          aria-pressed={dia.fechado}
          aria-label={`${opcao.label}: ${dia.fechado ? "fechado" : "aberto"}`}
          disabled={desabilitado}
          onClick={() => onChange({ fechado: !dia.fechado })}
        >
          {dia.fechado ? "Fechado" : "Aberto"}
        </button>
      </div>
      {!dia.fechado ? (
        <div className={styles.faixaHorario}>
          <input
            id={idAbertura}
            type="time"
            className={`${styles.input} ${styles.inputHorario}`}
            value={dia.abertura}
            onChange={(e) => onChange({ abertura: e.target.value })}
            disabled={desabilitado}
            aria-label={`Abertura de ${opcao.label}`}
          />
          <span className={styles.faixaHorarioAte}>até</span>
          <input
            id={idFechamento}
            type="time"
            className={`${styles.input} ${styles.inputHorario}`}
            value={dia.fechamento}
            onChange={(e) => onChange({ fechamento: e.target.value })}
            disabled={desabilitado}
            aria-label={`Fechamento de ${opcao.label}`}
          />
        </div>
      ) : null}
    </div>
  );
};
