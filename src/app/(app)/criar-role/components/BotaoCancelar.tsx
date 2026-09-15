"use client";

import Link from "next/link";
import type { ModoCriarRole } from "../types";
import styles from "../criar-role.module.css";

type Props = {
  desabilitado?: boolean;
  modo: ModoCriarRole;
};

const hrefDe = (modo: ModoCriarRole): string => {
  if (modo === "editar") return "/meus-roles";
  if (modo === "clonar") return "/perfil";
  return "/";
};

export const BotaoCancelar = ({ desabilitado, modo }: Props) => {
  return (
    <Link
      href={hrefDe(modo)}
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
