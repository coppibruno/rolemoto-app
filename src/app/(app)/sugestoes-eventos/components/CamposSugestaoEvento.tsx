"use client";

import type { useCartaoSugestaoEvento } from "../hooks/useCartaoSugestaoEvento";
import styles from "../sugestoes-eventos.module.css";

type Estado = ReturnType<typeof useCartaoSugestaoEvento>;

type Props = {
  idPrefix: string;
  estado: Estado;
};

export const CamposSugestaoEvento = ({ idPrefix, estado }: Props) => {
  const travado = estado.enviando !== null;
  return (
    <div className={styles.campos}>
      <label className={styles.campo} htmlFor={`${idPrefix}-titulo`}>
        <span className={styles.label}>Título</span>
        <input
          id={`${idPrefix}-titulo`}
          className={`${styles.input} ${estado.erroTitulo ? styles.inputErro : ""}`}
          value={estado.titulo}
          onChange={(event) => estado.setTitulo(event.target.value)}
          disabled={travado}
          maxLength={80}
        />
        {estado.erroTitulo ? <span className={styles.erroCampo}>{estado.erroTitulo}</span> : null}
      </label>
      <div className={styles.datas}>
        <label className={styles.campo} htmlFor={`${idPrefix}-data`}>
          <span className={styles.label}>Abertura</span>
          <input
            id={`${idPrefix}-data`}
            className={styles.input}
            type="date"
            value={estado.data}
            onChange={(event) => estado.setData(event.target.value)}
            disabled={travado}
          />
        </label>
        <label className={styles.campo} htmlFor={`${idPrefix}-hora`}>
          <span className={styles.label}>Hora</span>
          <input
            id={`${idPrefix}-hora`}
            className={styles.input}
            type="time"
            value={estado.hora}
            onChange={(event) => estado.setHora(event.target.value)}
            disabled={travado}
          />
        </label>
      </div>
      <label className={styles.marcarFim}>
        <input
          type="checkbox"
          checked={estado.temFim}
          onChange={(event) => estado.setTemFim(event.target.checked)}
          disabled={travado}
        />
        Tem encerramento
      </label>
      {estado.temFim ? (
        <div className={styles.datas}>
          <label className={styles.campo} htmlFor={`${idPrefix}-data-fim`}>
            <span className={styles.label}>Encerra</span>
            <input
              id={`${idPrefix}-data-fim`}
              className={styles.input}
              type="date"
              value={estado.dataFim}
              onChange={(event) => estado.setDataFim(event.target.value)}
              disabled={travado}
            />
          </label>
          <label className={styles.campo} htmlFor={`${idPrefix}-hora-fim`}>
            <span className={styles.label}>Hora</span>
            <input
              id={`${idPrefix}-hora-fim`}
              className={styles.input}
              type="time"
              value={estado.horaFim}
              onChange={(event) => estado.setHoraFim(event.target.value)}
              disabled={travado}
            />
          </label>
        </div>
      ) : null}
      <label className={styles.campo} htmlFor={`${idPrefix}-info`}>
        <span className={styles.label}>Informações</span>
        <textarea
          id={`${idPrefix}-info`}
          className={`${styles.input} ${styles.texto} ${estado.erroTexto ? styles.inputErro : ""}`}
          value={estado.informacoes}
          onChange={(event) => estado.setInformacoes(event.target.value)}
          disabled={travado}
          rows={4}
        />
      </label>
    </div>
  );
};
