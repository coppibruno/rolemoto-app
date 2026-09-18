import Link from "next/link";
import styles from "../meus-roles.module.css";

type Props = {
  nota: number;
  comentario: string;
  quando: string;
  hrefVerRelato: string;
  fotosCount?: number;
};

const estrelas = (nota: number): number[] =>
  Array.from({ length: 5 }, (_, i) => (i < Math.round(nota) ? 1 : 0));

export const BlocoPreviewAvaliacao = ({
  nota,
  comentario,
  quando,
  hrefVerRelato,
  fotosCount,
}: Props) => {
  const trecho =
    comentario.trim().length > 160
      ? `${comentario.trim().slice(0, 157)}…`
      : comentario.trim();

  return (
    <div className={styles.blocoPreview}>
      <div className={styles.blocoPreviewTopo}>
        <div className={styles.blocoPreviewNotas} aria-label={`Nota ${nota}`}>
          {estrelas(nota).map((preenchida, i) => (
            <span
              key={i}
              className={`material-symbols-outlined ${
                preenchida ? styles.estrelaCheia : styles.estrelaVazia
              }`}
              aria-hidden
            >
              star
            </span>
          ))}
          <span className={styles.blocoPreviewNotaNum}>{nota.toFixed(1)}</span>
        </div>
        <span className={styles.badgePublico}>Público no Feed</span>
      </div>
      {trecho ? (
        <p className={styles.blocoPreviewCitacao}>&ldquo;{trecho}&rdquo;</p>
      ) : null}
      {typeof fotosCount === "number" && fotosCount > 0 ? (
        <p className={styles.blocoPreviewFotos}>
          {fotosCount} {fotosCount === 1 ? "foto" : "fotos"} no relato
        </p>
      ) : null}
      <div className={styles.blocoPreviewRodape}>
        <span className={styles.blocoPreviewQuando}>{quando}</span>
        <Link href={hrefVerRelato} className={styles.linkVerRelato}>
          Ver relato
          <span className="material-symbols-outlined" aria-hidden>
            visibility
          </span>
        </Link>
      </div>
    </div>
  );
};
