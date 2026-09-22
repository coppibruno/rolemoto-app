import type { RitmoRole } from "@/types/role";
import { formatarFaixaHero } from "@/app/(app)/feed/formatar-horario";
import { LABELS_RITMO_CAPA } from "../constants";
import styles from "../convite-role.module.css";

type Props = {
  titulo: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  distanciaKm: number;
  dataHoraSaida: string;
};

const classeRitmo = (ritmo: RitmoRole) => {
  if (ritmo === "tranquila") return styles.badgeTranquila;
  if (ritmo === "moderada") return styles.badgeModerada;
  return styles.badgeAgressiva;
};

export const HeroCapaRole = ({
  titulo,
  fotoCapaUrl,
  ritmo,
  distanciaKm,
  dataHoraSaida,
}: Props) => {
  return (
    <section className={styles.hero}>
      {fotoCapaUrl ? (
        <img
          src={fotoCapaUrl}
          alt={`Capa do rolê ${titulo}`}
          className={styles.heroImg}
        />
      ) : (
        <div className={styles.heroPlaceholder} aria-hidden>
          <span className="material-symbols-outlined">two_wheeler</span>
        </div>
      )}
      <div className={styles.heroScrim} />
      <div className={styles.heroBadges}>
        <span className={`${styles.badge} ${styles.badgeKm}`}>
          {distanciaKm} KM total
        </span>
        <span className={`${styles.badge} ${classeRitmo(ritmo)}`}>
          {LABELS_RITMO_CAPA[ritmo]}
        </span>
      </div>
      <div className={styles.faixaData}>
        <span className="material-symbols-outlined" aria-hidden>
          calendar_month
        </span>
        <span>{formatarFaixaHero(dataHoraSaida)}</span>
      </div>
    </section>
  );
};
