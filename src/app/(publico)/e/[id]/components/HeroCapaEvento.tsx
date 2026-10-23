import { formatarPeriodoEvento } from "@/app/(app)/feed/formatar-horario";
import type { EventoPublico } from "@/types/evento-publico";
import { LABELS_ACESSO_EVENTO, LABELS_TIPO_EVENTO } from "../constants";
import styles from "../../../r/[id]/convite-role.module.css";

type Props = {
  evento: Pick<
    EventoPublico,
    | "titulo"
    | "fotoCapaUrl"
    | "tipo"
    | "acesso"
    | "dataHoraAbertura"
    | "dataHoraEncerramento"
  >;
};

export const HeroCapaEvento = ({ evento }: Props) => {
  return (
    <section className={styles.hero}>
      {evento.fotoCapaUrl ? (
        <img
          src={evento.fotoCapaUrl}
          alt={`Capa do evento ${evento.titulo}`}
          className={styles.heroImg}
        />
      ) : (
        <div className={styles.heroPlaceholder} aria-hidden>
          <span className="material-symbols-outlined">local_activity</span>
        </div>
      )}
      <div className={styles.heroScrim} />
      <div className={styles.heroBadges}>
        <span className={`${styles.badge} ${styles.badgeKm}`}>
          {LABELS_TIPO_EVENTO[evento.tipo] ?? "Evento"}
        </span>
        <span className={`${styles.badge} ${styles.badgeModerada}`}>
          {LABELS_ACESSO_EVENTO[evento.acesso]}
        </span>
      </div>
      <div className={styles.faixaData}>
        <span className="material-symbols-outlined" aria-hidden>
          calendar_month
        </span>
        <span>
          {formatarPeriodoEvento(
            evento.dataHoraAbertura,
            evento.dataHoraEncerramento,
          )}
        </span>
      </div>
    </section>
  );
};
