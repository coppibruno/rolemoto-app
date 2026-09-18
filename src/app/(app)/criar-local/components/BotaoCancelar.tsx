"use client";

import Link from "next/link";
import styles from "../criar-local.module.css";

type Props = {
  desabilitado?: boolean;
};

export const BotaoCancelar = ({ desabilitado }: Props) => {
  return (
    <Link
      href="/"
      className={`${styles.botaoCancelar} ${
        desabilitado ? styles.botaoCancelarDesabilitado : ""
      }`}
      aria-disabled={desabilitado}
      tabIndex={desabilitado ? -1 : undefined}
    >
      Cancelar
    </Link>
  );
};
