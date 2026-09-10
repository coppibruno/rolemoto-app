"use client";

import styles from "../confirmacao-role.module.css";

type Props = {
  mensagem: string;
  onVoltar: () => void;
};

export const EstadoErro = ({ mensagem, onVoltar }: Props) => {
  return (
    <div className={styles.estado} role="alert">
      <span className="material-symbols-outlined">error</span>
      <p className={styles.estadoTitulo}>{mensagem}</p>
      <p className={styles.estadoTexto}>
        Não foi possível abrir a confirmação deste rolê.
      </p>
      <button type="button" className={styles.botaoEstado} onClick={onVoltar}>
        Voltar ao feed
      </button>
    </div>
  );
};
