"use client";

import { DIAS_CURTOS } from "@/lib/rotulo-dia-semana";
import { hojeYmdSaoPaulo } from "../montar-iso-evento";
import styles from "../criar-evento.module.css";

type Props = {
  diaSemana: number | null;
  horaAbertura: string;
  horaEncerramento: string;
  aPartirDe: string;
  onDia: (dia: number) => void;
  onAbertura: (valor: string) => void;
  onEncerramento: (valor: string) => void;
  onAPartirDe: (valor: string) => void;
  erroDia?: string;
  erroAbertura?: string;
  erroEncerramento?: string;
  erroAPartirDe?: string;
  desabilitado?: boolean;
  apoio?: string;
};

export const CamposEncontroSemanal = ({
  diaSemana,
  horaAbertura,
  horaEncerramento,
  aPartirDe,
  onDia,
  onAbertura,
  onEncerramento,
  onAPartirDe,
  erroDia,
  erroAbertura,
  erroEncerramento,
  erroAPartirDe,
  desabilitado,
  apoio,
}: Props) => (
  <div className={styles.cartao}>
    <span className={styles.label} id="dia-semana-label">
      Dia <span className={styles.obrigatorio}>*</span>
    </span>
    <div className={styles.chips} role="radiogroup" aria-labelledby="dia-semana-label">
      {DIAS_CURTOS.map((label, dia) => (
        <button
          key={label}
          type="button"
          role="radio"
          aria-checked={diaSemana === dia}
          className={`${styles.chip} ${diaSemana === dia ? styles.chipAtivo : ""}`}
          onClick={() => onDia(dia)}
          disabled={desabilitado}
        >
          {label}
        </button>
      ))}
    </div>
    {erroDia ? (
      <p className={styles.erroCampo} role="alert">
        {erroDia}
      </p>
    ) : null}
    <div className={styles.gradeDataHora}>
      <div className={styles.campo}>
        <label htmlFor="hora-abertura-serie" className={styles.label}>
          Hora de abertura <span className={styles.obrigatorio}>*</span>
        </label>
        <input
          id="hora-abertura-serie"
          type="time"
          className={`${styles.input} ${erroAbertura ? styles.inputErro : ""}`}
          value={horaAbertura}
          onChange={(evento) => onAbertura(evento.target.value)}
          disabled={desabilitado}
        />
      </div>
      <div className={styles.campo}>
        <label htmlFor="hora-encerramento-serie" className={styles.label}>
          Hora de encerramento <span className={styles.obrigatorio}>*</span>
        </label>
        <input
          id="hora-encerramento-serie"
          type="time"
          className={`${styles.input} ${erroEncerramento ? styles.inputErro : ""}`}
          value={horaEncerramento}
          onChange={(evento) => onEncerramento(evento.target.value)}
          disabled={desabilitado}
        />
      </div>
    </div>
    {erroAbertura ? (
      <p className={styles.erroCampo} role="alert">
        {erroAbertura}
      </p>
    ) : null}
    {erroEncerramento ? (
      <p className={styles.erroCampo} role="alert">
        {erroEncerramento}
      </p>
    ) : null}
    <div className={styles.campo}>
      <label htmlFor="a-partir-de" className={`${styles.label} ${styles.labelLinha}`}>
        <span>A partir de</span>
        <span className={styles.hintOpcional}>Opcional</span>
      </label>
      <input
        id="a-partir-de"
        type="date"
        className={`${styles.input} ${erroAPartirDe ? styles.inputErro : ""}`}
        value={aPartirDe}
        min={hojeYmdSaoPaulo()}
        onChange={(evento) => onAPartirDe(evento.target.value)}
        disabled={desabilitado}
      />
    </div>
    {erroAPartirDe ? (
      <p className={styles.erroCampo} role="alert">
        {erroAPartirDe}
      </p>
    ) : null}
    {apoio ? <p className={styles.hintStory}>{apoio}</p> : null}
  </div>
);
