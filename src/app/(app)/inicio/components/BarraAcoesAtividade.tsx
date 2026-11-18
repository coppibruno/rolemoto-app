import Link from "next/link";
import { ehHrefExterno, type CtaAtividade } from "../atividade-texto";
import styles from "../inicio.module.css";

type Props = {
  curtido: boolean;
  totalCurtidas: number;
  totalComentarios: number | null;
  podeComentar: boolean;
  cta: CtaAtividade | null;
  onCurtir: () => void;
  onComentar: () => void;
};

export const BarraAcoesAtividade = ({
  curtido,
  totalCurtidas,
  totalComentarios,
  podeComentar,
  cta,
  onCurtir,
  onComentar,
}: Props) => (
  <>
    <div className={styles.barraAcoes}>
      <button
        type="button"
        className={`${styles.acao} ${styles.acaoCurtida} ${curtido ? styles.acaoCurtidaAtiva : ""}`}
        aria-label={curtido ? "Descurtir" : "Curtir"}
        aria-pressed={curtido}
        onClick={onCurtir}
      >
        <span className="material-symbols-outlined" aria-hidden>
          favorite
        </span>
        {totalCurtidas > 0 ? totalCurtidas : null}
      </button>
      {podeComentar ? (
        <button
          type="button"
          className={styles.acao}
          aria-label="Comentar"
          onClick={onComentar}
        >
          <span className="material-symbols-outlined" aria-hidden>
            chat_bubble
          </span>
          {totalComentarios && totalComentarios > 0 ? totalComentarios : null}
        </button>
      ) : null}
      {cta ? (
        ehHrefExterno(cta.href) ? (
          <a
            href={cta.href}
            className={styles.ctaChip}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {cta.rotulo}
          </a>
        ) : (
          <Link href={cta.href} className={styles.ctaChip} onClick={(e) => e.stopPropagation()}>
            {cta.rotulo}
          </Link>
        )
      ) : null}
    </div>
    {podeComentar && totalComentarios != null && totalComentarios > 0 ? (
      <button type="button" className={styles.verComentarios} onClick={onComentar}>
        Ver os {totalComentarios} comentários
      </button>
    ) : null}
  </>
);
