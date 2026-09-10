"use client";

import { hojeYmdSaoPaulo } from "../montar-iso-saida";
import styles from "../criar-role.module.css";

type Props = {
  dataSaida: string;
  horaSaida: string;
  onChangeData: (valor: string) => void;
  onChangeHora: (valor: string) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const CampoDataHora = ({
  dataSaida,
  horaSaida,
  onChangeData,
  onChangeHora,
  erro,
  desabilitado,
}: Props) => {
  const erroId = "data-hora-erro";
  const minData = hojeYmdSaoPaulo();

  return (
    <div className={`${styles.cartao} ${erro ? styles.cartaoErro : ""}`}>
      <div className={styles.gradeDataHora}>
        <div className={styles.campo}>
          <label htmlFor="data-saida" className={styles.label}>
            <span className="material-symbols-outlined" aria-hidden>
              event
            </span>
            Data
          </label>
          <input
            id="data-saida"
            type="date"
            className={`${styles.input} ${erro ? styles.inputErro : ""}`}
            value={dataSaida}
            min={minData}
            onChange={(e) => onChangeData(e.target.value)}
            disabled={desabilitado}
            aria-invalid={Boolean(erro)}
            aria-describedby={erro ? erroId : undefined}
          />
        </div>
        <div className={styles.campo}>
          <label htmlFor="hora-saida" className={styles.label}>
            <span className="material-symbols-outlined" aria-hidden>
              schedule
            </span>
            Horário
          </label>
          <input
            id="hora-saida"
            type="time"
            className={`${styles.input} ${erro ? styles.inputErro : ""}`}
            value={horaSaida}
            onChange={(e) => onChangeHora(e.target.value)}
            disabled={desabilitado}
            aria-invalid={Boolean(erro)}
            aria-describedby={erro ? erroId : undefined}
          />
        </div>
      </div>
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
