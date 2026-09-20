"use client";

import Link from "next/link";
import { hrefEditarRole } from "@/app/(app)/meus-roles/constants";
import styles from "../confirmacao-role.module.css";

type Props = {
  roleId: string;
  titulo: string;
  saidaFutura: boolean;
  cancelando: boolean;
  erroAcao: string | null;
  onVoltar: () => void;
  onCancelarRole: () => void;
};

export const EstadoOrganizador = ({
  roleId,
  titulo,
  saidaFutura,
  cancelando,
  erroAcao,
  onVoltar,
  onCancelarRole,
}: Props) => {
  return (
    <div className={styles.estado} role="status">
      <span className="material-symbols-outlined">sports_motorsports</span>
      <p className={styles.estadoTitulo}>Você organiza este rolê</p>
      <p className={styles.estadoTexto}>
        Não é possível solicitar vaga na própria saída.
      </p>
      <Link
        href={`/aprovacoes?role=${roleId}`}
        className={styles.botaoEstadoPrimario}
      >
        Aprovar Pilotos
      </Link>
      {saidaFutura ? (
        <div className={styles.acoesOrganizador}>
          <Link
            href={hrefEditarRole(roleId)}
            className={styles.botaoEditarRole}
            aria-label={`Editar ${titulo}`}
          >
            <span className="material-symbols-outlined">edit</span>
            Editar rolê
          </Link>
          <button
            type="button"
            className={styles.botaoExcluirRole}
            onClick={onCancelarRole}
            disabled={cancelando}
            aria-label={`Cancelar rolê ${titulo}`}
          >
            <span className="material-symbols-outlined">delete</span>
            Cancelar rolê
          </button>
        </div>
      ) : null}
      {erroAcao ? (
        <p className={styles.estadoErro} role="alert">
          {erroAcao}
        </p>
      ) : null}
      <button type="button" className={styles.botaoEstado} onClick={onVoltar}>
        Voltar ao feed
      </button>
    </div>
  );
};
