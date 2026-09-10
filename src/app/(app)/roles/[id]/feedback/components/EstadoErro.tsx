"use client";

import styles from "../feedback-role.module.css";

type Props = {
  titulo: string;
  corpo: string;
  onVoltar: () => void;
  onTentar?: () => void;
};

export const EstadoErro = ({ titulo, corpo, onVoltar, onTentar }: Props) => {
  return (
    <div className={styles.estado} role="alert">
      <span className="material-symbols-outlined" aria-hidden>
        error
      </span>
      <p className={styles.estadoTitulo}>{titulo}</p>
      <p className={styles.estadoTexto}>{corpo}</p>
      {onTentar ? (
        <button type="button" className={styles.botaoEstado} onClick={onTentar}>
          Tentar de novo
        </button>
      ) : (
        <button type="button" className={styles.botaoEstado} onClick={onVoltar}>
          Voltar ao feed
        </button>
      )}
    </div>
  );
};
