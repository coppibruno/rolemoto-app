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

const mesmoDia = (a: string, b: string): boolean => {
  const dia = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  return dia(a) === dia(b);
};

export const BlocoDataEvento = ({ evento }: Props) => {
  const abertura = formatarHoraEvento(evento.dataHoraAbertura);
  const encerramentoIso = evento.dataHoraEncerramento;
  const encerramento = encerramentoIso
    ? formatarHoraEvento(encerramentoIso)
    : null;
  const diasDiferentes = Boolean(
    encerramentoIso && !mesmoDia(evento.dataHoraAbertura, encerramentoIso),
  );

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitulo}>{TITULO_DATA}</h3>
      <div className={styles.dataLinha}>
        <span className="material-symbols-outlined" aria-hidden>
          calendar_today
        </span>
        <p className={styles.dataTexto}>
          {diasDiferentes && encerramentoIso
            ? `${formatarDataExtenso(evento.dataHoraAbertura)} ${abertura} até ${formatarDataExtenso(encerramentoIso)} ${encerramento}`
            : formatarDataExtenso(evento.dataHoraAbertura)}
        </p>
      </div>
      {diasDiferentes ? null : (
        <p className={styles.horaTexto}>
          Abertura {abertura}
          {encerramento ? ` · até ${encerramento}` : null}
        </p>
      )}
      <span className={styles.badgeAcesso}>
        {LABELS_ACESSO_EVENTO[evento.acesso]}
      </span>
    </section>
  );
};
