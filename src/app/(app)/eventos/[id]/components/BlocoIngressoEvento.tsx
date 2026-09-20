import type { EventoDetalhe } from "@/types/evento";
import { CTA_INGRESSO } from "../constants";
import styles from "../evento-detalhe.module.css";

type Props = {
  evento: EventoDetalhe;
};

export const BlocoIngressoEvento = ({ evento }: Props) => {
  if (evento.acesso !== "ingresso" || !evento.linkIngresso?.trim()) {
    return null;
  }

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitulo}>
        <span className="material-symbols-outlined" aria-hidden>
          confirmation_number
        </span>
        Ingresso
      </h3>
      <a
        href={evento.linkIngresso}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.ctaExterno}
      >
        <span className="material-symbols-outlined" aria-hidden>
          open_in_new
        </span>
        {CTA_INGRESSO}
      </a>
    </section>
  );
};
