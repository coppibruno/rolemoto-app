import { BotaoInscreverEvento } from "@/app/(app)/feed/components/BotaoInscreverEvento";
import { BlocoParticipantes } from "@/components/participantes/BlocoParticipantes";
import type { EventoDetalhe } from "@/types/evento";
import { TITULO_PRESENCAS } from "../constants";
import styles from "../evento-detalhe.module.css";

type Props = {
  evento: EventoDetalhe;
};

export const BlocoPresencasEvento = ({ evento }: Props) => {
  const total = evento.inscritos?.total ?? evento.participantes?.total ?? 0;

  return (
    <section className={styles.card}>
      <div className={styles.cardCabecalho}>
        <h3 className={styles.cardTitulo}>
          <span className="material-symbols-outlined" aria-hidden>
            group
          </span>
          {TITULO_PRESENCAS}
        </h3>
        <span className={styles.contagem}>{total}</span>
      </div>
      {evento.participantes?.total > 0 ? (
        <BlocoParticipantes
          tipo="evento"
          id={evento.id}
          participantes={evento.participantes}
        />
      ) : null}
      <BotaoInscreverEvento
        id={evento.id}
        acesso={evento.acesso}
        linkIngresso={evento.linkIngresso}
        inscrito={evento.inscrito}
      />
    </section>
  );
};
