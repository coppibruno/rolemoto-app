"use client";

import { useEffect, useState } from "react";
import { formatarCronometro } from "@/lib/telemetria/formatar-telemetria";
import { BotaoControleGravacao } from "./BotaoControleGravacao";
import { StatusGravacao } from "./StatusGravacao";
import styles from "@/components/telemetria/telemetria.module.css";

type Props = {
  iniciadoEm: string;
  ocupado: boolean;
  onEncerrar: () => void;
};

const segundosDesde = (iso: string): number =>
  Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));

export const PainelGravacaoAtiva = ({
  iniciadoEm,
  ocupado,
  onEncerrar,
}: Props) => {
  const [segundos, setSegundos] = useState(() => segundosDesde(iniciadoEm));

  useEffect(() => {
    setSegundos(segundosDesde(iniciadoEm));
    const id = window.setInterval(() => {
      setSegundos(segundosDesde(iniciadoEm));
    }, 1000);
    return () => window.clearInterval(id);
  }, [iniciadoEm]);

  return (
    <section className={`${styles.card} ${styles.cardCockpit}`}>
      <div className={styles.statusLinha}>
        <StatusGravacao
          label="Gravando em segundo plano"
          hint="Sinal GPS ativo e otimizado"
          gravando
        />
        <div className={styles.cronometro}>
          <span className="material-symbols-outlined">timer</span>
          <span className={styles.cronometroNum}>
            {formatarCronometro(segundos)}
          </span>
        </div>
      </div>
      <BotaoControleGravacao
        label="Encerrar e ver rota"
        icone="stop_circle"
        disabled={ocupado}
        onClick={onEncerrar}
      />
    </section>
  );
};
