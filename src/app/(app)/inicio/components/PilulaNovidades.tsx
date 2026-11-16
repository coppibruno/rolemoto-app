import { rotuloNovidades } from "../atividade-texto";
import styles from "../inicio.module.css";

type Props = {
  total: number;
  onToque: () => void;
};

export const PilulaNovidades = ({ total, onToque }: Props) => {
  if (total <= 0) return null;
  return (
    <div className={styles.pilulaWrap}>
      <button type="button" className={styles.pilula} onClick={onToque}>
        <span className={styles.pilulaTexto}>{rotuloNovidades(total)}</span>
      </button>
    </div>
  );
};
