import type { ReactNode } from "react";
import styles from "../../ofertas.module.css";

type Props = {
  rotulo: string;
  erro?: string;
  ajuda?: string;
  /** Grupo de botões vira `fieldset`; campo único fica no `label`. */
  grupo?: boolean;
  children: ReactNode;
};

export const CampoOferta = ({ rotulo, erro, ajuda, grupo, children }: Props) => {
  const conteudo = (
    <>
      {ajuda ? <p className={styles.campoAjuda}>{ajuda}</p> : null}
      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
    </>
  );

  if (grupo) {
    return (
      <fieldset className={styles.campo}>
        <legend className={styles.campoRotulo}>{rotulo}</legend>
        {children}
        {conteudo}
      </fieldset>
    );
  }

  return (
    <div className={styles.campo}>
      <label className={styles.campo}>
        <span className={styles.campoRotulo}>{rotulo}</span>
        {children}
      </label>
      {conteudo}
    </div>
  );
};
