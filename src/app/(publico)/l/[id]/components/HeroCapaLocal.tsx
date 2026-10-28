import {
  ICONES_CATEGORIA_LOCAL,
  LABELS_CATEGORIA_LOCAL,
} from "@/app/(app)/feed/constants";
import type { LocalPublico } from "@/types/local-publico";
import styles from "../../../r/[id]/convite-role.module.css";

type Props = {
  local: Pick<
    LocalPublico,
    "nome" | "fotoFachadaUrl" | "categoria" | "notaMedia" | "totalAvaliacoes"
  >;
};

export const HeroCapaLocal = ({ local }: Props) => {
  const nota =
    local.totalAvaliacoes > 0 ? local.notaMedia.toFixed(1) : null;

  return (
    <section className={styles.hero}>
      {local.fotoFachadaUrl ? (
        <img
          src={local.fotoFachadaUrl}
          alt={`Fachada de ${local.nome}`}
          className={styles.heroImg}
        />
      ) : (
        <div className={styles.heroPlaceholder} aria-hidden>
          <span className="material-symbols-outlined">
            {ICONES_CATEGORIA_LOCAL[local.categoria]}
          </span>
        </div>
      )}
      <div className={styles.heroScrim} />
      <div className={styles.heroBadges}>
        <span className={`${styles.badge} ${styles.badgeKm}`}>
          {LABELS_CATEGORIA_LOCAL[local.categoria]}
        </span>
        {nota ? (
          <span className={`${styles.badge} ${styles.badgeModerada}`}>
            ★ {nota}
          </span>
        ) : null}
      </div>
    </section>
  );
};
