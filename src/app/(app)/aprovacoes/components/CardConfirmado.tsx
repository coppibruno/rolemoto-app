"use client";

import type { SolicitacaoLider } from "@/types/aprovacao";
import { formatarHorarioSaida } from "@/app/(app)/feed/formatar-horario";
import { BadgePilotagem } from "./BadgePilotagem";
import { FaixaRoleCard } from "./FaixaRoleCard";
import { IdentidadePiloto } from "./IdentidadePiloto";
import styles from "../aprovacoes.module.css";

type Props = {
  item: SolicitacaoLider;
};

export const CardConfirmado = ({ item }: Props) => {
  const aceitoEm = item.participacao.aceitoEm;

  return (
    <article className={styles.card}>
      <FaixaRoleCard role={item.role} />
      <IdentidadePiloto usuario={item.usuario} />
      <BadgePilotagem pilotagem={item.usuario.pilotagem} />
      <span className={styles.badgeNaGrade}>
        <span className="material-symbols-outlined" aria-hidden>
          check_circle
        </span>
        Na grade
      </span>
      {aceitoEm ? (
        <p className={styles.aceitoEm}>
          Confirmado em {formatarHorarioSaida(aceitoEm)}
        </p>
      ) : null}
    </article>
  );
};
