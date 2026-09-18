import { LABEL_PILOTAGEM } from "@/components/perfil/constants-tipo-moto";
import type { Pilotagem } from "@/types/user";
import styles from "../perfil-publico.module.css";

type Props = {
  pilotagem: Pilotagem;
};

const classeBadge = (pilotagem: Pilotagem): string => {
  if (pilotagem === "tranquila") return styles.badgeTranquila;
  if (pilotagem === "moderada") return styles.badgeModerada;
  return styles.badgeAgressiva;
};

export const RitmoPublico = ({ pilotagem }: Props) => {
  return (
    <section className={styles.secao} aria-labelledby="ritmo-publico-titulo">
      <div className={styles.secaoTituloLinha}>
        <span
          className={`material-symbols-outlined ${styles.iconeRitmoSecao}`}
          aria-hidden
        >
          speed
        </span>
        <h2 id="ritmo-publico-titulo" className={styles.secaoTitulo}>
          Ritmo de Pilotagem
        </h2>
      </div>
      <div className={styles.card}>
        <div className={styles.ritmoLinha}>
          <span className={styles.ritmoLabel}>Classificação de Guia:</span>
          <span className={`${styles.badgeRitmo} ${classeBadge(pilotagem)}`}>
            {LABEL_PILOTAGEM[pilotagem]}
          </span>
        </div>
      </div>
    </section>
  );
};
