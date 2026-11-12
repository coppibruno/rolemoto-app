import type { BalcaoLocal } from "@/types/oferta-local";
import styles from "../../ofertas.module.css";

type Props = {
  semana: BalcaoLocal["semana"];
};

export const SemanaBalcao = ({ semana }: Props) => (
  <section className={styles.bloco} aria-labelledby="titulo-semana-balcao">
    <h2 id="titulo-semana-balcao" className={styles.secao}>
      Esta semana
    </h2>
    <div className={styles.semana}>
      <p className={styles.numero}>
        <b>{semana.cuponsAbertos}</b>
        <span>abriram o cupom</span>
      </p>
      <p className={styles.numero}>
        <b>{semana.checkins}</b>
        <span>marcaram presença</span>
      </p>
    </div>
  </section>
);
