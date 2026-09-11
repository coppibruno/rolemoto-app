import type { ReactNode } from "react";
import styles from "../convite-role.module.css";

type Props = {
  icone: string;
  iconeClasse: string;
  label: string;
  titulo: string;
  detalhe?: ReactNode;
};

export const ItemFicha = ({
  icone,
  iconeClasse,
  label,
  titulo,
  detalhe,
}: Props) => {
  return (
    <div className={styles.itemFicha}>
      <span className={`${styles.itemIcone} ${iconeClasse}`}>
        <span className="material-symbols-outlined" aria-hidden>
          {icone}
        </span>
      </span>
      <div className={styles.itemCorpo}>
        <span className={styles.itemLabel}>{label}</span>
        <p className={styles.itemTitulo}>{titulo}</p>
        {detalhe}
      </div>
    </div>
  );
};
