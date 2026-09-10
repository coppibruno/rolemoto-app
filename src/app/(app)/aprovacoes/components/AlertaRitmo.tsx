"use client";

import type { RitmoRole } from "@/types/role";
import { LABELS_RITMO, TEXTO_ALERTA_RITMO } from "../constants";
import styles from "../aprovacoes.module.css";

type Props = {
  visivel: boolean;
  ritmo: RitmoRole;
};

export const AlertaRitmo = ({ visivel, ritmo }: Props) => {
  if (!visivel) return null;

  const destaque = LABELS_RITMO[ritmo];
  const [antes, depois] = TEXTO_ALERTA_RITMO(ritmo).split(destaque);

  return (
    <div className={styles.alertaRitmo} role="note">
      <span className="material-symbols-outlined" aria-hidden>
        warning
      </span>
      <div>
        <p className={styles.alertaTitulo}>Atenção ao Ritmo do Grupo</p>
        <p className={styles.alertaTexto}>
          {antes}
          <strong className={styles.alertaDestaque}>{destaque}</strong>
          {depois}
        </p>
      </div>
    </div>
  );
};
