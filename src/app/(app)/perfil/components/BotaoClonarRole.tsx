"use client";

import Link from "next/link";
import { hrefClonarRole } from "../constants";
import styles from "../historico-pistas.module.css";

type Props = {
  roleId: string;
  titulo: string;
};

export const BotaoClonarRole = ({ roleId, titulo }: Props) => {
  return (
    <Link
      href={hrefClonarRole(roleId)}
      className={styles.botaoClonar}
      aria-label={`Clonar ${titulo}`}
    >
      <span className="material-symbols-outlined" aria-hidden>
        content_copy
      </span>
    </Link>
  );
};
