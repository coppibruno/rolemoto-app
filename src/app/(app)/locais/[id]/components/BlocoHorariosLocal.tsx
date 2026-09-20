import { agruparHorarios, labelStatusAberto } from "@/lib/horario-local";
import type { LocalDetalhe } from "@/types/local";
import { ABERTO_24H, TITULO_HORARIOS } from "../constants";
import styles from "../local-detalhe.module.css";

type Props = {
  local: LocalDetalhe;
};

const labelGrupo = (inicio: string, fim: string): string =>
  inicio === fim ? inicio : `${inicio}–${fim}`;

export const BlocoHorariosLocal = ({ local }: Props) => {
  const status = labelStatusAberto(local);

  return (
    <section className={styles.card}>
      <div className={styles.cardCabecalho}>
        <h3 className={styles.cardTitulo}>
          <span className="material-symbols-outlined" aria-hidden>
            schedule
          </span>
          {TITULO_HORARIOS}
        </h3>
        <span
          className={`${styles.badgeStatus} ${status === "Fechado" ? styles.badgeFechado : styles.badgeAberto}`}
        >
          <span className={styles.pontoStatus} aria-hidden />
          {status}
        </span>
      </div>

      {local.aberto24h ? (
        <div className={styles.itemHorario}>
          <span className={styles.itemHorarioDia}>{ABERTO_24H}</span>
        </div>
      ) : (
        <ul className={styles.lista}>
          {agruparHorarios(local.horarios).map((grupo) => (
            <li
              key={`${grupo.inicio.valor}-${grupo.fim.valor}`}
              className={styles.itemHorario}
            >
              <span className={styles.itemHorarioDia}>
                {labelGrupo(grupo.inicio.label, grupo.fim.label)}
              </span>
              <span className={styles.itemHorarioFaixa}>
                {grupo.fechado
                  ? "Fechado"
                  : `${grupo.abertura}–${grupo.fechamento}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
