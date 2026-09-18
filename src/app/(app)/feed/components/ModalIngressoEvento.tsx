"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import { ERRO_LINK_INGRESSO, MODAL_INGRESSO } from "../constants";
import styles from "./modal-ingresso-evento.module.css";

type Props = {
  linkIngresso: string | null;
  onFechar: () => void;
};

export const ModalIngressoEvento = ({ linkIngresso, onFechar }: Props) => {
  const cartaoRef = useFocoModal(onFechar);

  const irParaCompra = () => {
    if (!linkIngresso) {
      window.alert(ERRO_LINK_INGRESSO);
      return;
    }
    window.open(linkIngresso, "_blank", "noopener,noreferrer");
    onFechar();
  };

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        ref={cartaoRef}
        className={styles.cartao}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-ingresso"
        aria-describedby="descricao-modal-ingresso"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.icone} aria-hidden>
          <span className="material-symbols-outlined">confirmation_number</span>
        </div>
        <h2 id="titulo-modal-ingresso" className={styles.titulo}>
          {MODAL_INGRESSO.titulo}
        </h2>
        <p id="descricao-modal-ingresso" className={styles.corpo}>
          {MODAL_INGRESSO.corpo}
        </p>
        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.botaoPrimario}
            onClick={irParaCompra}
            data-foco-inicial
          >
            {MODAL_INGRESSO.comprar}
          </button>
          <button
            type="button"
            className={styles.botaoSecundario}
            onClick={onFechar}
          >
            {MODAL_INGRESSO.agoraNao}
          </button>
        </div>
      </div>
    </div>
  );
};
