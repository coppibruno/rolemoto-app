"use client";

import { useEffect, useRef } from "react";
import type { UsuarioRoleFeedback } from "@/types/usuario-role-feedback";
import {
  TITULO_LISTA,
  VAZIO_LISTA_CORPO,
  VAZIO_LISTA_TITULO,
} from "../constants";
import { CardRelato } from "./CardRelato";
import styles from "../feedback-role.module.css";

type Props = {
  relatos: UsuarioRoleFeedback[];
  uid: string | undefined;
  focarTitulo: boolean;
};

const ordenar = (
  relatos: UsuarioRoleFeedback[],
  uid: string | undefined,
): UsuarioRoleFeedback[] => {
  if (!uid) return relatos;
  return [...relatos].sort((a, b) => {
    if (a.usuarioId === uid && b.usuarioId !== uid) return -1;
    if (b.usuarioId === uid && a.usuarioId !== uid) return 1;
    return 0;
  });
};

export const ListaRelatosComboio = ({ relatos, uid, focarTitulo }: Props) => {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const ordenados = ordenar(relatos, uid);

  useEffect(() => {
    if (focarTitulo) {
      tituloRef.current?.focus();
    }
  }, [focarTitulo]);

  return (
    <section>
      <h2
        ref={tituloRef}
        tabIndex={-1}
        className={styles.tituloLista}
      >
        {TITULO_LISTA}
      </h2>
      {ordenados.length === 0 ? (
        <div className={styles.vazioLista} role="status">
          <span className="material-symbols-outlined" aria-hidden>
            rate_review
          </span>
          <p className={styles.vazioTitulo}>{VAZIO_LISTA_TITULO}</p>
          <p className={styles.vazioTexto}>{VAZIO_LISTA_CORPO}</p>
        </div>
      ) : (
        <div className={styles.listaRelatos} aria-label="Relatos do comboio">
          {ordenados.map((relato) => (
            <CardRelato
              key={relato.id}
              relato={relato}
              eMeu={relato.usuarioId === uid}
            />
          ))}
        </div>
      )}
    </section>
  );
};
