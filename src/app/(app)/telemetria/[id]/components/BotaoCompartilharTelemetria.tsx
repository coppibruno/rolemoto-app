"use client";

import { useCompartilharTelemetria } from "../hooks/useCompartilharTelemetria";
import styles from "@/components/telemetria/telemetria.module.css";

type Props = {
  id: string;
  titulo: string;
};

export const BotaoCompartilharTelemetria = ({ id, titulo }: Props) => {
  const { compartilhar, feedback } = useCompartilharTelemetria(titulo, id);

  return (
    <>
      <button type="button" className={styles.cta} onClick={() => void compartilhar()}>
        <span className="material-symbols-outlined">ios_share</span>
        Compartilhar
      </button>
      {feedback ? (
        <p className={styles.toast} role="status">
          {feedback}
        </p>
      ) : null}
    </>
  );
};
