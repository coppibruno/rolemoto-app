import {
  INTRO_SUBTITULO,
  INTRO_SUBTITULO_CLONE,
  INTRO_SUBTITULO_EDITAR,
  INTRO_TITULO,
  INTRO_TITULO_CLONE,
  INTRO_TITULO_EDITAR,
} from "../constants";
import type { ModoCriarRole } from "../types";
import styles from "../criar-role.module.css";

type Props = {
  modo: ModoCriarRole;
};

const TITULOS: Record<ModoCriarRole, string> = {
  criar: INTRO_TITULO,
  clonar: INTRO_TITULO_CLONE,
  editar: INTRO_TITULO_EDITAR,
};

const SUBTITULOS: Record<ModoCriarRole, string> = {
  criar: INTRO_SUBTITULO,
  clonar: INTRO_SUBTITULO_CLONE,
  editar: INTRO_SUBTITULO_EDITAR,
};

export const IntroBriefing = ({ modo }: Props) => {
  return (
    <div className={styles.intro}>
      <div className={styles.introTopo}>
        <div className={styles.introBriefing}>
          <span className={styles.pontoPulse} aria-hidden />
          <span className={styles.badgeBriefing}>Briefing Inicial</span>
        </div>
        <span className={styles.badgePasso}>Passo 1 de 1</span>
      </div>
      <h2 className={styles.introTitulo}>{TITULOS[modo]}</h2>
      <p className={styles.introSubtitulo}>{SUBTITULOS[modo]}</p>
    </div>
  );
};
