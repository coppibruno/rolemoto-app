"use client";

import { useRouter } from "next/navigation";
import { COPY } from "../constants";
import styles from "../notificacoes.module.css";

type Props = {
  podeMarcarTodas: boolean;
  marcandoTodas: boolean;
  onMarcarTodas: () => void;
};

export const CabecalhoNotificacoes = ({
  podeMarcarTodas,
  marcandoTodas,
  onMarcarTodas,
}: Props) => {
  const router = useRouter();

  const voltar = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <header className={styles.cabecalho}>
      <button type="button" className={styles.botaoVoltar} aria-label="Voltar" onClick={voltar}>
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 className={styles.titulo}>{COPY.titulo}</h1>
      <button
        type="button"
        className={styles.marcarTodas}
        disabled={!podeMarcarTodas || marcandoTodas}
        onClick={onMarcarTodas}
      >
        {COPY.marcarTodas}
      </button>
    </header>
  );
};
