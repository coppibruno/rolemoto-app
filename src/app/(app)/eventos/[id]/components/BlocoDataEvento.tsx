import { LABELS_ACESSO_EVENTO } from "@/app/(app)/feed/constants";
import type { EventoDetalhe } from "@/types/evento";
import { TITULO_DATA } from "../constants";
import {
  formatarDataExtenso,
  formatarHoraEvento,
} from "../formatar-data-evento";
import styles from "../evento-detalhe.module.css";

type Props = {
  evento: EventoDetalhe;
};

export const BlocoDataEvento = ({ evento }: Props) => {
  const abertura = formatarHoraEvento(evento.dataHoraAbertura);
  const encerramento = evento.dataHoraEncerramento
    ? formatarHoraEvento(evento.dataHoraEncerramento)
    : null;

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitulo}>{TITULO_DATA}</h3>
      <div className={styles.dataLinha}>
        <span className="material-symbols-outlined" aria-hidden>
          calendar_today
        </span>
        <p className={styles.dataTexto}>
          {formatarDataExtenso(evento.dataHoraAbertura)}
        </p>
      </div>
      <p className={styles.horaTexto}>
        Abertura {abertura}
        {encerramento ? ` · até ${encerramento}` : null}
      </p>
      <span className={styles.badgeAcesso}>
        {LABELS_ACESSO_EVENTO[evento.acesso]}
      </span>
    </section>
  );
};
