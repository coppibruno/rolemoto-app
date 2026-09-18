import Link from "next/link";
import styles from "../locais.module.css";

type Props = {
  admin: boolean;
};

export const EstadoVazioLocais = ({ admin }: Props) => {
  return (
    <div className={styles.vazio} role="status">
      <span className={`material-symbols-outlined ${styles.vazioIcone}`}>
        location_off
      </span>
      <h2 className={styles.vazioTitulo}>Nenhum ponto oficial ainda.</h2>
      {admin ? (
        <Link href="/criar-local" className={styles.ctaVazio}>
          Cadastrar o primeiro local
        </Link>
      ) : null}
    </div>
  );
};
