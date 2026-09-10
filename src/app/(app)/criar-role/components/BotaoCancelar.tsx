"use client";

import Link from "next/link";
import styles from "../criar-role.module.css";

type Props = {
  desabilitado?: boolean;
  modoClone?: boolean;
};

export const BotaoCancelar = ({ desabilitado, modoClone }: Props) => {
  return (
    <Link
      href={modoClone ? "/perfil" : "/"}
      className={`${styles.botaoCancelar} ${
        desabilitado ? styles.botaoCancelarDesabilitado : ""
      }`}
      aria-disabled={desabilitado}
      tabIndex={desabilitado ? -1 : undefined}
    >
      Cancelar e Voltar
    </Link>
  );
};
