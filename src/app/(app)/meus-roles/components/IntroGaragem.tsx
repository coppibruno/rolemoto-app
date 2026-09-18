import { SUBTITULO_GARAGEM } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  mostrarTune: boolean;
  sheetAberto: boolean;
  onTune: () => void;
};

export const IntroGaragem = ({ mostrarTune, sheetAberto, onTune }: Props) => {
  return (
    <section className={styles.intro}>
      <div className={styles.introTopo}>
        <div>
          <span className={styles.kicker}>
            <span className={styles.kickerPulso} aria-hidden />
            Painel de Garagem
          </span>
          <h1 className={styles.titulo}>
            MEUS <span>ROLÊS</span>
          </h1>
          <p className={styles.subtitulo}>{SUBTITULO_GARAGEM}</p>
        </div>
        {mostrarTune ? (
          <button
            type="button"
            className={styles.tune}
            onClick={onTune}
            aria-label="Filtros"
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
