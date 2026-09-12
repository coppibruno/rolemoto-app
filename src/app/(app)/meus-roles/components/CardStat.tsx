import styles from "../meus-roles.module.css";

type Props = {
  rotulo: string;
  valor: string;
  unidade: string;
  icone: string;
  ariaLabel: string;
  faixa: "ciano" | "ambar" | "laranja";
};

export const CardStat = ({
  rotulo,
  valor,
  unidade,
  icone,
  ariaLabel,
  faixa,
}: Props) => {
  return (
    <article className={styles.stat} aria-label={ariaLabel}>
      <div className={styles.statTopo}>
        <span className={styles.statRotulo}>{rotulo}</span>
        <span className={`material-symbols-outlined ${styles[`statIcone_${faixa}`]}`}>
          {icone}
        </span>
      </div>
      <div className={styles.statValor}>
        <span className={styles.statNum}>{valor}</span>
        <span className={styles[`statUnidade_${faixa}`]}>{unidade}</span>
      </div>
      <span className={`${styles.statFaixa} ${styles[`statFaixa_${faixa}`]}`} />
    </article>
  );
};
