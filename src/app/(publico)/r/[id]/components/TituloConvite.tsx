import { COPY_ENCERRADO, COPY_VAGAS } from "../constants";
import styles from "../convite-role.module.css";

type Props = {
  titulo: string;
  descricao: string;
  encerrado: boolean;
};

export const TituloConvite = ({ titulo, descricao, encerrado }: Props) => {
  const texto = descricao.trim();

  return (
    <section>
      <h1 className={styles.titulo}>{titulo}</h1>
      {texto ? <p className={styles.descricao}>{texto}</p> : null}
      <p className={styles.status}>
        <span className={encerrado ? styles.pulsoOff : styles.pulso} aria-hidden />
        <span>{encerrado ? COPY_ENCERRADO : COPY_VAGAS}</span>
      </p>
    </section>
  );
};
