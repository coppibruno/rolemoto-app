"use client";

import { hojeYmdSaoPaulo } from "../montar-iso-evento";
import styles from "../criar-evento.module.css";

type Props = {
  dataEvento: string;
  horaAbertura: string;
  horaEncerramento: string;
  onChangeData: (valor: string) => void;
  onChangeAbertura: (valor: string) => void;
  onChangeEncerramento: (valor: string) => void;
  erroData?: string;
  erroAbertura?: string;
  erroEncerramento?: string;
  desabilitado?: boolean;
};

export const CampoDataHorarios = ({
  dataEvento,
  horaAbertura,
  horaEncerramento,
  onChangeData,
  onChangeAbertura,
  onChangeEncerramento,
  erroData,
  erroAbertura,
  erroEncerramento,
  desabilitado,
}: Props) => {
  const erroDataId = "data-evento-erro";
  const erroAberturaId = "hora-abertura-erro";
  const erroFimId = "hora-encerramento-erro";
  const minData = hojeYmdSaoPaulo();
  const temErro = Boolean(erroData || erroAbertura || erroEncerramento);

  return (
    <div className={`${styles.cartao} ${temErro ? styles.cartaoErro : ""}`}>
      <div className={styles.gradeDataHora}>
        <div className={styles.campo}>
          <label htmlFor="data-evento" className={styles.label}>
            Data <span className={styles.obrigatorio}>*</span>
          </label>
          <input
            id="data-evento"
            type="date"
            className={`${styles.input} ${erroData ? styles.inputErro : ""}`}
            value={dataEvento}
            min={minData}
            onChange={(e) => onChangeData(e.target.value)}
            disabled={desabilitado}
            aria-invalid={Boolean(erroData)}
            aria-describedby={erroData ? erroDataId : undefined}
          />
        </div>
        <div className={styles.campo}>
          <label htmlFor="hora-abertura" className={styles.label}>
            Abertura <span className={styles.obrigatorio}>*</span>
          </label>
          <input
            id="hora-abertura"
            type="time"
            className={`${styles.input} ${erroAbertura ? styles.inputErro : ""}`}
            value={horaAbertura}
            onChange={(e) => onChangeAbertura(e.target.value)}
            disabled={desabilitado}
            aria-invalid={Boolean(erroAbertura)}
            aria-describedby={erroAbertura ? erroAberturaId : undefined}
          />
        </div>
      </div>
      <div className={styles.campo}>
        <label htmlFor="hora-encerramento" className={`${styles.label} ${styles.labelLinha}`}>
          <span>Horário de Encerramento</span>
          <span className={styles.hintOpcional}>Opcional</span>
        </label>
        <input
          id="hora-encerramento"
          type="time"
          className={`${styles.input} ${erroEncerramento ? styles.inputErro : ""}`}
          value={horaEncerramento}
          onChange={(e) => onChangeEncerramento(e.target.value)}
          disabled={desabilitado}
          aria-invalid={Boolean(erroEncerramento)}
          aria-describedby={erroEncerramento ? erroFimId : undefined}
        />
      </div>
      {erroData ? (
        <p id={erroDataId} className={styles.erroCampo} role="alert">
          {erroData}
        </p>
      ) : null}
      {erroAbertura ? (
        <p id={erroAberturaId} className={styles.erroCampo} role="alert">
          {erroAbertura}
        </p>
      ) : null}
      {erroEncerramento ? (
        <p id={erroFimId} className={styles.erroCampo} role="alert">
          {erroEncerramento}
        </p>
      ) : null}
    </div>
  );
};
