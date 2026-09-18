"use client";

import type { HorarioDiaForm } from "@/types/local";
import { DIAS_SEMANA_UI } from "@/lib/horario-local";
import { LinhaHorarioDia } from "./LinhaHorarioDia";
import styles from "../criar-local.module.css";

type Props = {
  aberto24h: boolean;
  horarios: HorarioDiaForm[];
  onMudarModo: (aberto24h: boolean) => void;
  onMudarDia: (dia: HorarioDiaForm["dia"], patch: Partial<HorarioDiaForm>) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const SeletorHorarioLocal = ({
  aberto24h,
  horarios,
  onMudarModo,
  onMudarDia,
  erro,
  desabilitado,
}: Props) => {
  const erroId = "horario-local-erro";

  return (
    <div className={`${styles.cartao} ${erro ? styles.cartaoErro : ""}`}>
      <span className={styles.label} id="horario-local-label">
        Horário de Funcionamento *
      </span>
      <div
        className={styles.segmentoHorario}
        role="radiogroup"
        aria-labelledby="horario-local-label"
        aria-describedby={erro ? erroId : undefined}
      >
        <button
          type="button"
          role="radio"
          aria-checked={aberto24h}
          className={`${styles.botaoHorario} ${aberto24h ? styles.botaoHorarioAtivo : ""}`}
          onClick={() => onMudarModo(true)}
          disabled={desabilitado}
        >
          <span className="material-symbols-outlined" aria-hidden>
            all_inclusive
          </span>
          Aberto 24 Horas
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!aberto24h}
          className={`${styles.botaoHorario} ${!aberto24h ? styles.botaoHorarioAtivo : ""}`}
          onClick={() => onMudarModo(false)}
          disabled={desabilitado}
        >
          <span className="material-symbols-outlined" aria-hidden>
            schedule
          </span>
          Específico
        </button>
      </div>
      {!aberto24h ? (
        <div className={styles.listaDias}>
          {DIAS_SEMANA_UI.map((opcao) => {
            const dia = horarios.find((item) => item.dia === opcao.valor);
            if (!dia) return null;
            return (
              <LinhaHorarioDia
                key={opcao.valor}
                opcao={opcao}
                dia={dia}
                desabilitado={desabilitado}
                onChange={(patch) => onMudarDia(dia.dia, patch)}
              />
            );
          })}
        </div>
      ) : null}
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
