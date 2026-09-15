"use client";

import Link from "next/link";
import { hrefEditarRole } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  roleId: string;
  titulo: string;
  cancelando: boolean;
  onCancelar: () => void;
};

export const AcoesOrganizadorRole = ({
  roleId,
  titulo,
  cancelando,
  onCancelar,
}: Props) => {
  return (
    <div className={styles.acoesOrganizador}>
      <Link
        href={hrefEditarRole(roleId)}
        className={styles.botaoEditarRole}
        aria-label={`Editar ${titulo}`}
      >
        <span className="material-symbols-outlined">edit</span>
        Editar
      </Link>
      <button
        type="button"
        className={styles.botaoExcluirRole}
        onClick={onCancelar}
        disabled={cancelando}
        aria-label={`Cancelar rolê ${titulo}`}
      >
        <span className="material-symbols-outlined">delete</span>
        Cancelar rolê
      </button>
    </div>
  );
};
