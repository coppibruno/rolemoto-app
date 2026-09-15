"use client";

import {
  CTA_PUBLICAR,
  CTA_PUBLICANDO,
  CTA_SALVAR,
  CTA_SALVANDO,
} from "../constants";
import type { ModoCriarRole } from "../types";
import styles from "../criar-role.module.css";

type Props = {
  publicando: boolean;
  modo: ModoCriarRole;
};

export const BotaoPublicar = ({ publicando, modo }: Props) => {
  const editar = modo === "editar";
  const icone = editar ? "save" : "two_wheeler";
  const label = publicando
    ? editar
      ? CTA_SALVANDO
      : CTA_PUBLICANDO
    : editar
      ? CTA_SALVAR
      : CTA_PUBLICAR;

  return (
    <button type="submit" className={styles.botaoPublicar} disabled={publicando}>
      {publicando ? (
        <span className={`material-symbols-outlined ${styles.girando}`}>
          autorenew
        </span>
      ) : (
        <span className="material-symbols-outlined">{icone}</span>
      )}
      {label}
    </button>
  );
};
