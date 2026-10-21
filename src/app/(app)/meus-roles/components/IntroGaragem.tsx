import styles from "../meus-roles.module.css";

type Props = {
  mostrarTune: boolean;
  tuneAtivo: boolean;
  sheetAberto: boolean;
  onTune: () => void;
};

export const IntroGaragem = ({ mostrarTune, tuneAtivo, sheetAberto, onTune }: Props) => {
  return (
    <section className={styles.intro}>
      <div className={styles.introTopo}>
        <h1 className={styles.titulo}>Meus rolês</h1>
        {mostrarTune ? (
          <button
            type="button"
            className={tuneAtivo ? `${styles.tune} ${styles.tuneAtivo}` : styles.tune}
            onClick={onTune}
            aria-label={tuneAtivo ? "Filtros (ativos)" : "Filtros"}
            aria-expanded={sheetAberto}
            aria-controls="sheet-filtros-meus-roles"
          >
            <span className="material-symbols-outlined">tune</span>
          </button>
        ) : null}
      </div>
    </section>
  );
};
