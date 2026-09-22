import Link from "next/link";
import type { RoleDetalhe } from "@/types/role";
import { formatarHorarioSaida } from "@/app/(app)/feed/formatar-horario";
import { tituloLocal } from "@/lib/localizacao";
import {
  hrefEditarRole,
  LABEL_CONTAGEM_CONFIRMADOS,
  LABEL_CONTAGEM_PENDENTES,
  LABELS_RITMO,
  saidaFutura,
} from "../constants";
import styles from "../gerenciar-role.module.css";

type Props = {
  detalhe: RoleDetalhe;
  pendentes: number;
  cancelando: boolean;
  onCancelar: () => void;
};

export const ResumoRoleGerenciar = ({
  detalhe,
  pendentes,
  cancelando,
  onCancelar,
}: Props) => {
  const rota = `${tituloLocal(detalhe.localSaida)} → ${tituloLocal(detalhe.destinoFinal)}`;
  const futura = saidaFutura(detalhe.dataHoraSaida);
  const confirmados = detalhe.participantes.confirmados;

  return (
    <section className={styles.ficha} aria-label="Resumo do rolê">
      <div className={styles.capa}>
        {detalhe.fotoCapaUrl ? (
          <img
            src={detalhe.fotoCapaUrl}
            alt=""
            className={styles.capaImg}
          />
        ) : (
          <div className={styles.capaPlaceholder} aria-hidden>
            <span className="material-symbols-outlined">two_wheeler</span>
          </div>
        )}
        <div className={styles.capaScrim} />
      </div>

      <h2 className={styles.fichaTitulo}>{detalhe.titulo}</h2>
      <p className={styles.fichaMeta}>{formatarHorarioSaida(detalhe.dataHoraSaida)}</p>
      <p className={styles.rota}>
        <span className="material-symbols-outlined" aria-hidden>
          near_me
        </span>
        <span>{rota}</span>
      </p>
      <span className={`${styles.ritmo} ${styles[`ritmo_${detalhe.ritmo}`]}`}>
        {LABELS_RITMO[detalhe.ritmo]}
      </span>

      <div className={styles.contagens}>
        <div className={styles.contagem}>
          <span className={styles.contagemValor}>{pendentes}</span>
          <span className={styles.contagemRotulo}>{LABEL_CONTAGEM_PENDENTES}</span>
        </div>
        <div className={styles.contagem}>
          <span className={styles.contagemValor}>{confirmados}</span>
          <span className={styles.contagemRotulo}>{LABEL_CONTAGEM_CONFIRMADOS}</span>
        </div>
      </div>

      {futura ? (
        <div className={styles.acoesRole}>
          <Link
            href={hrefEditarRole(detalhe.id)}
            className={styles.botaoEditar}
            aria-label={`Editar ${detalhe.titulo}`}
          >
            <span className="material-symbols-outlined">edit</span>
            Editar
          </Link>
          <button
            type="button"
            className={styles.botaoCancelar}
            onClick={onCancelar}
            disabled={cancelando}
            aria-label={`Cancelar rolê ${detalhe.titulo}`}
          >
            <span className="material-symbols-outlined">delete</span>
            Cancelar
          </button>
        </div>
      ) : null}
    </section>
  );
};
