import type { ReactNode } from "react";
import styles from "../convite-role.module.css";

type Props = {
  icone: string;
  iconeClasse: string;
  label: string;
  titulo: string;
  subtitulo?: string;
  detalhe?: ReactNode;
  acao?: ReactNode;
};

export const ItemFicha = ({
  icone,
  iconeClasse,
  label,
  titulo,
  subtitulo,
  detalhe,
  acao,
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
        {subtitulo ? <p className={styles.itemSubtitulo}>{subtitulo}</p> : null}
        {detalhe}
        {acao ? <div className={styles.itemAcao}>{acao}</div> : null}
      </div>
    </div>
  );
};
