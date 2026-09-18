"use client";

import type {
  ParticipanteResumo,
  TipoAlvoParticipantes,
} from "@/types/participante";
import { rotuloTotal } from "./constants";
import styles from "./participantes.module.css";

type Props = {
  tipo: TipoAlvoParticipantes;
  total: number;
  destaques: ParticipanteResumo[];
  onAbrirLista: () => void;
  compacto?: boolean;
};

export const PilhaParticipantes = ({
  tipo,
  total,
  destaques,
  onAbrirLista,
  compacto = false,
}: Props) => {
  if (total <= 0) {
    return null;
  }

  const extras = Math.max(0, total - destaques.length);

  return (
    <button
      type="button"
      className={compacto ? styles.pilhaCompacta : styles.pilha}
      onClick={onAbrirLista}
      aria-label={`Ver ${rotuloTotal(tipo, total)}`}
    >
      <span className={styles.avatares} aria-hidden>
        {destaques.map((d) =>
          d.fotoUrl ? (
            <img
              key={d.uid}
              src={d.fotoUrl}
              alt=""
              className={styles.avatar}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span key={d.uid} className={styles.avatarIniciais}>
              {d.iniciais}
            </span>
          ),
        )}
        {extras > 0 ? (
          <span className={styles.avatarMais}>+{extras}</span>
        ) : null}
      </span>
      <span className={styles.pilhaLabel}>{rotuloTotal(tipo, total)}</span>
    </button>
  );
};
