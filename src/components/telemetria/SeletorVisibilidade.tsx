"use client";

import styles from "./telemetria.module.css";

type Props = {
  publica: boolean;
  desabilitado?: boolean;
  onMudar: (publica: boolean) => void;
};

export const SeletorVisibilidade = ({
  publica,
  desabilitado,
  onMudar,
}: Props) => {
  return (
    <fieldset className={styles.visibilidade} disabled={desabilitado}>
      <legend className={styles.visibilidadeLegenda}>Quem pode ver</legend>
      <div className={styles.visibilidadeOpcoes} role="radiogroup" aria-label="Quem pode ver">
        <label className={publica ? styles.visibilidadeOpcao : `${styles.visibilidadeOpcao} ${styles.visibilidadeOpcaoAtiva}`}>
          <input
            type="radio"
            name="visibilidade-passeio"
            checked={!publica}
            onChange={() => onMudar(false)}
          />
          <span className="material-symbols-outlined" aria-hidden>
            lock
          </span>
          Só eu
        </label>
        <label className={publica ? `${styles.visibilidadeOpcao} ${styles.visibilidadeOpcaoAtiva}` : styles.visibilidadeOpcao}>
          <input
            type="radio"
            name="visibilidade-passeio"
            checked={publica}
            onChange={() => onMudar(true)}
          />
          <span className="material-symbols-outlined" aria-hidden>
            public
          </span>
          Todos no meu perfil
        </label>
      </div>
    </fieldset>
  );
};
