"use client";

import { useAuth } from "@/hooks/useAuth";
import styles from "./apagar-catalogo.module.css";

type Props = {
  rotulo: string;
  ocupado: boolean;
  erro: string | null;
  onApagar: () => void;
};

export const BotaoApagarCatalogo = ({ rotulo, ocupado, erro, onApagar }: Props) => {
  const admin = useAuth().usuario?.admin === true;
  if (!admin) return null;

  return (
    <div className={styles.bloco}>
      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
      <button type="button" className={styles.botao} onClick={onApagar} disabled={ocupado}>
        <span className="material-symbols-outlined" aria-hidden>
          delete
        </span>
        {ocupado ? "Apagando…" : rotulo}
      </button>
    </div>
  );
};
