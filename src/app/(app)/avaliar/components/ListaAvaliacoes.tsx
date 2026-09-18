"use client";

import type { AvaliacaoExperiencia } from "@/types/avaliacao-experiencia";
import {
  TITULO_LISTA,
  VAZIO_LISTA_CORPO,
  VAZIO_LISTA_TITULO,
} from "../constants";
import { CardAvaliacao } from "./CardAvaliacao";
import styles from "../avaliar.module.css";

type Props = {
  avaliacoes: AvaliacaoExperiencia[];
  uid?: string;
};

export const ListaAvaliacoes = ({ avaliacoes, uid }: Props) => {
  if (avaliacoes.length === 0) {
    return (
      <div className={styles.vazioLista}>
        <p className={styles.vazioListaTitulo}>{VAZIO_LISTA_TITULO}</p>
        <p className={styles.vazioListaCorpo}>{VAZIO_LISTA_CORPO}</p>
      </div>
    );
  }

  return (
    <section className={styles.lista} aria-label={TITULO_LISTA}>
      <h2 className={styles.listaTitulo}>{TITULO_LISTA}</h2>
      {avaliacoes.map((item) => (
        <CardAvaliacao
          key={item.id}
          avaliacao={item}
          eMinha={Boolean(uid && item.usuarioId === uid)}
        />
      ))}
    </section>
  );
};
