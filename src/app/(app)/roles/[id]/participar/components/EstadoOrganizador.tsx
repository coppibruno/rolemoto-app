"use client";

import Link from "next/link";
import styles from "../confirmacao-role.module.css";

type Props = {
  roleId: string;
  onVoltar: () => void;
};

export const EstadoOrganizador = ({ roleId, onVoltar }: Props) => {
  return (
    <div className={styles.estado} role="status">
      <span className="material-symbols-outlined">sports_motorsports</span>
      <p className={styles.estadoTitulo}>Você organiza este rolê</p>
      <p className={styles.estadoTexto}>
        Não é possível solicitar vaga na própria saída.
      </p>
      <Link
        href={`/aprovacoes?role=${roleId}`}
        className={styles.botaoEstadoPrimario}
      >
        Aprovar Pilotos
      </Link>
      <button type="button" className={styles.botaoEstado} onClick={onVoltar}>
        Voltar ao feed
      </button>
    </div>
  );
};
