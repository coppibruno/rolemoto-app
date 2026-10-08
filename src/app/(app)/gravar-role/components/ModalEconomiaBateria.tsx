"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import { MODAL_ECONOMIA_BATERIA } from "../constants";
import styles from "./modal-economia-bateria.module.css";

type Props = {
  onDesativar: () => void;
  onFechar: () => void;
};

export const ModalEconomiaBateria = ({ onDesativar, onFechar }: Props) => {
  const cartaoRef = useFocoModal(onFechar);

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        ref={cartaoRef}
        className={styles.cartao}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-economia"
        aria-describedby="descricao-modal-economia"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.icone} aria-hidden>
          <span className="material-symbols-outlined">battery_saver</span>
        </div>
        <h2 id="titulo-modal-economia" className={styles.titulo}>
          {MODAL_ECONOMIA_BATERIA.titulo}
        </h2>
        <p id="descricao-modal-economia" className={styles.corpo}>
          {MODAL_ECONOMIA_BATERIA.corpo}
        </p>
        <p className={styles.dica}>{MODAL_ECONOMIA_BATERIA.dica}</p>
        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.botaoPrimario}
            onClick={onDesativar}
            data-foco-inicial
          >
            {MODAL_ECONOMIA_BATERIA.desativar}
          </button>
          <button
            type="button"
            className={styles.botaoSecundario}
            onClick={onFechar}
          >
            {MODAL_ECONOMIA_BATERIA.agoraNao}
          </button>
        </div>
      </div>
    </div>
  );
};
