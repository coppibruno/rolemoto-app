import Link from "next/link";
import styles from "../meus-roles.module.css";

type Props = {
  href: string;
  titulo: string;
  descricao?: string;
  labelCta: string;
};

export const BlocoCtaAvaliar = ({
  href,
  titulo,
  descricao,
  labelCta,
}: Props) => {
  return (
    <div className={styles.blocoCta}>
      <div className={styles.blocoCtaTopo}>
        <span className={styles.blocoCtaTitulo}>
          <span className="material-symbols-outlined" aria-hidden>
            star_rate
          </span>
          {titulo}
        </span>
      </div>
      {descricao ? <p className={styles.blocoCtaDesc}>{descricao}</p> : null}
      <Link href={href} className={styles.botaoAvaliarGaragem}>
        <span className="material-symbols-outlined" aria-hidden>
          rate_review
        </span>
        {labelCta}
      </Link>
    </div>
  );
};
