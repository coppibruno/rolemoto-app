"use client";

import Link from "next/link";
import type { ErroModelo } from "../types";
import styles from "../criar-role.module.css";

type Props = {
  erro: ErroModelo;
  onTentarDeNovo: () => void;
};

export const EstadoErroModelo = ({ erro, onTentarDeNovo }: Props) => {
  const icone = erro.tipo === "rede" ? "warning" : "explore_off";

  return (
    <div className={styles.estadoModelo} role="alert">
      <span className="material-symbols-outlined">{icone}</span>
      <p className={styles.estadoModeloTitulo}>{erro.mensagem}</p>
      {erro.tipo === "rede" ? (
        <button
          type="button"
          className={styles.botaoTentar}
          onClick={onTentarDeNovo}
        >
          Tentar de novo
        </button>
      ) : (
        <Link href="/perfil" className={styles.botaoTentar}>
          Voltar ao perfil
        </Link>
      )}
    </div>
  );
};
