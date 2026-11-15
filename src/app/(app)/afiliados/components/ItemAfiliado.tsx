"use client";

import { useState } from "react";
import { linkAfiliado } from "@/lib/afiliado";
import type { Afiliado } from "@/types/afiliado";
import styles from "../afiliados.module.css";

type Props = {
  afiliado: Afiliado;
};

export const ItemAfiliado = ({ afiliado }: Props) => {
  const [copiado, setCopiado] = useState(false);
  const link = linkAfiliado(afiliado.id);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1600);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <article className={styles.item}>
      <div className={styles.itemTopo}>
        <span className={styles.itemNome}>{afiliado.nome}</span>
        <span className={styles.itemCodigo}>{afiliado.id}</span>
      </div>
      <button type="button" className={styles.itemLink} onClick={() => void copiar()}>
        <span className={styles.itemLinkTexto}>{link}</span>
        <span className="material-symbols-outlined" aria-hidden>
          {copiado ? "check" : "content_copy"}
        </span>
        <span className={styles.srOnly}>{copiado ? "Link copiado" : "Copiar link"}</span>
      </button>
      <dl className={styles.numeros}>
        <div>
          <dt>Cliques</dt>
          <dd>{afiliado.cliques}</dd>
        </div>
        <div>
          <dt>Contas</dt>
          <dd>{afiliado.contas}</dd>
        </div>
      </dl>
    </article>
  );
};
