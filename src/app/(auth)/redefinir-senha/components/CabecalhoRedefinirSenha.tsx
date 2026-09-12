import Link from "next/link";
import { COPY } from "../constants";
import styles from "../redefinir-senha.module.css";

type Props = {
  focarVoltar?: boolean;
};

export const CabecalhoRedefinirSenha = ({ focarVoltar = false }: Props) => {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <Link
          href="/login"
          className={styles.voltarHeader}
          aria-label="Voltar para o login"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className={styles.marca}>
          <span className={`material-symbols-outlined ${styles.marcaIcone}`}>
            two_wheeler
          </span>
          <span className={styles.marcaTexto}>
            ROLÊ<span className={styles.marcaDestaque}>MOTO</span>
          </span>
        </div>
        <div className={styles.avatarDecorativo} aria-hidden>
          <span className="material-symbols-outlined">person</span>
        </div>
      </div>
      <div className={styles.chipVoltarWrap}>
        <Link
          href="/login"
          className={styles.chipVoltar}
          data-foco-inicial={focarVoltar ? true : undefined}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          {COPY.voltarLogin}
        </Link>
      </div>
    </header>
  );
};
