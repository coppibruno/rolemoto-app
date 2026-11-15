import Link from "next/link";
import styles from "../perfil.module.css";

export const LinhaAfiliados = () => (
  <Link href="/afiliados" className={styles.meusPontosLinha}>
    <span className="material-symbols-outlined" aria-hidden>
      link
    </span>
    <span className={styles.meusPontosNome}>Links de afiliado</span>
    <span className="material-symbols-outlined" aria-hidden>
      chevron_right
    </span>
  </Link>
);
