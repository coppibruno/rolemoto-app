import { COPY_ABERTO, COPY_ENCERRADO, COPY_INFORMACOES_MAX } from "../constants";
import styles from "../../../r/[id]/convite-role.module.css";

type Props = {
  titulo: string;
  informacoes: string;
  encerrado: boolean;
};

const recorte = (texto: string): string => {
  if (texto.length <= COPY_INFORMACOES_MAX) return texto;
  return `${texto.slice(0, COPY_INFORMACOES_MAX).trimEnd()}…`;
};

export const TituloConviteEvento = ({ titulo, informacoes, encerrado }: Props) => {
  const texto = recorte(informacoes.trim());

  return (
    <section>
      <h1 className={styles.titulo}>{titulo}</h1>
      {texto ? <p className={styles.descricao}>{texto}</p> : null}
      <p className={styles.status}>
        <span className={encerrado ? styles.pulsoOff : styles.pulso} aria-hidden />
        <span>{encerrado ? COPY_ENCERRADO : COPY_ABERTO}</span>
      </p>
    </section>
  );
};
