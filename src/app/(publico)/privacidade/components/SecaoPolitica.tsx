import type { ReactNode } from "react";
import styles from "../privacidade.module.css";

type Props = {
  id: string;
  titulo: string;
  children: ReactNode;
};

export const SecaoPolitica = ({ id, titulo, children }: Props) => (
  <section id={id} className={styles.secao} aria-labelledby={`${id}-titulo`}>
    <h2 id={`${id}-titulo`} className={styles.tituloSecao}>
      {titulo}
    </h2>
    {children}
  </section>
);
