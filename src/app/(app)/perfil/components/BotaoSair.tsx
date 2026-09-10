"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import styles from "../perfil.module.css";

type Props = {
  desabilitado?: boolean;
};

export const BotaoSair = ({ desabilitado }: Props) => {
  const { logout } = useAuth();
  const [saindo, setSaindo] = useState(false);

  const sair = async () => {
    setSaindo(true);
    try {
      await logout();
    } finally {
      setSaindo(false);
    }
  };

  return (
    <button
      type="button"
      className={styles.botaoSair}
      onClick={sair}
      disabled={desabilitado || saindo}
    >
      <span className="material-symbols-outlined">logout</span>
      Sair da conta
    </button>
  );
};
