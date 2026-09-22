"use client";

import { useState } from "react";
import type { SolicitacaoLider } from "@/types/aprovacao";
import { CardConfirmado } from "@/app/(app)/aprovacoes/components/CardConfirmado";
import { SECAO_CONFIRMADOS, VAZIO_CONFIRMADOS } from "../constants";
import styles from "../gerenciar-role.module.css";

type Props = {
  itens: SolicitacaoLider[];
};

export const SecaoConfirmados = ({ itens }: Props) => {
  const [aberta, setAberta] = useState(true);

  return (
    <section className={styles.secao} aria-label={SECAO_CONFIRMADOS}>
      <div className={styles.secaoCabecalho}>
        <h3 className={styles.secaoTitulo}>
          {SECAO_CONFIRMADOS}
          {itens.length > 0 ? ` (${itens.length})` : ""}
        </h3>
        {itens.length > 0 ? (
          <button
            type="button"
            className={styles.secaoToggle}
            aria-expanded={aberta}
            onClick={() => setAberta((v) => !v)}
          >
            {aberta ? "Ocultar" : "Mostrar"}
            <span className="material-symbols-outlined" aria-hidden>
              {aberta ? "expand_less" : "expand_more"}
            </span>
          </button>
        ) : null}
      </div>
      {itens.length === 0 ? (
        <p className={styles.vazio}>{VAZIO_CONFIRMADOS}</p>
      ) : aberta ? (
        <div className={styles.lista}>
          {itens.map((item) => (
            <CardConfirmado key={item.id} item={item} ocultarFaixa />
          ))}
        </div>
      ) : null}
    </section>
  );
};
