import { OPCOES_TIPO } from "@/app/(app)/criar-evento/constants";
import { labelCountdownEvento } from "@/lib/countdown-evento";
import type { EventoDetalhe } from "@/types/evento";
import styles from "../evento-detalhe.module.css";

type Props = {
  evento: EventoDetalhe;
};

export const HeroEvento = ({ evento }: Props) => {
  const tipo = OPCOES_TIPO.find((item) => item.valor === evento.tipo);
  const countdown = labelCountdownEvento(
    evento.dataHoraAbertura,
    evento.dataHoraEncerramento,
  );

  return (
    <section className={styles.hero}>
      <div className={evento.fotoCapaUrl ? styles.heroCapa : styles.heroCapaVazia}>
        {evento.fotoCapaUrl ? (
          <img src={evento.fotoCapaUrl} alt="" className={styles.heroCapaImg} />
        ) : (
          <span className="material-symbols-outlined" aria-hidden>
            local_activity
          </span>
        )}
        <div className={styles.heroGradiente} />
        <div className={styles.heroBadges}>
          <span className={styles.badgeTipo}>
            <span className="material-symbols-outlined" aria-hidden>
              {tipo?.icone ?? "sports_motorsports"}
            </span>
            {tipo?.label ?? evento.tipo}
          </span>
          <span className={styles.pillCountdown}>{countdown}</span>
        </div>
      </div>
      <div className={styles.heroCorpo}>
        <h2 className={styles.tituloHero}>{evento.titulo}</h2>
      </div>
    </section>
  );
};
