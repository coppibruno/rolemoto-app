"use client";

import styles from "../aprovacoes.module.css";

type Props = {
  nome: string;
  titulo: string;
  decidindo: boolean;
  onRecusar: () => void;
  onAceitar: () => void;
};

export const AcoesSolicitacao = ({
  nome,
  titulo,
  decidindo,
  onRecusar,
  onAceitar,
}: Props) => {
  return (
    <div className={styles.acoes}>
      <button
        type="button"
        className={styles.botaoRecusar}
        disabled={decidindo}
        aria-label={`Recusar ${nome} em ${titulo}`}
        onClick={onRecusar}
      >
        <span className="material-symbols-outlined" aria-hidden>
          close
        </span>
        Recusar
      </button>
      <button
        type="button"
        className={styles.botaoAceitar}
        disabled={decidindo}
        aria-label={`Aceitar ${nome} em ${titulo}`}
        onClick={onAceitar}
      >
        <span className="material-symbols-outlined" aria-hidden>
          check
        </span>
        Aceitar
      </button>
    </div>
  );
};
