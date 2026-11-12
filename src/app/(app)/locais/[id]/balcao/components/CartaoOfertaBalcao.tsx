"use client";

import { useState } from "react";
import Link from "next/link";
import { janelaLongaOferta } from "@/lib/oferta-local";
import type { OfertaLocal } from "@/types/oferta-local";
import styles from "../../ofertas.module.css";

type Props = {
  localId: string;
  oferta: OfertaLocal;
  ocupada: boolean;
  onAlternarPausa: (oferta: OfertaLocal) => void;
  onApagar: (oferta: OfertaLocal) => void;
};

const status = (oferta: OfertaLocal) => {
  if (!oferta.ativa) return { texto: "Pausada", classe: styles.statusPausada };
  if (oferta.vigente) return { texto: "No ar", classe: styles.statusNoAr };
  return { texto: "Fora do horário", classe: styles.statusFora };
};

export const CartaoOfertaBalcao = ({ localId, oferta, ocupada, onAlternarPausa, onApagar }: Props) => {
  const [confirmandoApagar, setConfirmandoApagar] = useState(false);
  const { texto, classe } = status(oferta);

  return (
    <li className={styles.cartaoOferta}>
      <div className={styles.cartaoTopo}>
        <strong className={styles.linhaTitulo}>{oferta.titulo}</strong>
        <span className={styles.linhaRotulo}>{oferta.rotulo}</span>
      </div>
      <span className={`${styles.status} ${classe}`}>{texto}</span>
      <span className={styles.cartaoCodigo}>{oferta.codigo}</span>
      <small className={styles.linhaJanela}>
        {janelaLongaOferta(oferta)}
        {oferta.tetoDia ? ` · até ${oferta.tetoDia} por dia` : ""}
      </small>
      <div className={styles.cartaoAcoes}>
        {confirmandoApagar ? (
          <>
            <button
              type="button"
              className={styles.botaoPerigo}
              onClick={() => onApagar(oferta)}
              disabled={ocupada}
            >
              Apagar oferta
            </button>
            <button type="button" className={styles.botaoTexto} onClick={() => setConfirmandoApagar(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.botaoTexto}
              onClick={() => onAlternarPausa(oferta)}
              disabled={ocupada}
            >
              {oferta.ativa ? "Pausar" : "Voltar ao ar"}
            </button>
            <Link href={`/locais/${localId}/ofertas/${oferta.id}`} className={styles.botaoTexto}>
              Editar
            </Link>
            <button type="button" className={styles.botaoTexto} onClick={() => setConfirmandoApagar(true)}>
              Apagar
            </button>
          </>
        )}
      </div>
    </li>
  );
};
