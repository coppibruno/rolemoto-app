"use client";

import { useEffect, useState } from "react";
import { formatarDuracao } from "@/lib/telemetria/formatar-telemetria";
import { COPY_TELEMETRIA } from "../constants";
import styles from "../telemetria-role.module.css";

type Props = {
  iniciadoEm: string;
};

export const PainelGravacaoAtiva = ({ iniciadoEm }: Props) => {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const decorrido = Math.max(
    0,
    Math.floor((agora - Date.parse(iniciadoEm)) / 1000),
  );

  return (
    <div className={styles.gravando} role="status">
      <span className={styles.badge}>
        <span className={styles.pulso} aria-hidden />
        {COPY_TELEMETRIA.gravando}
      </span>
      <span className={styles.cronometro}>{formatarDuracao(decorrido)}</span>
    </div>
  );
};
