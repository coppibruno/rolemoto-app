"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import styles from "../seguir.module.css";

type Props = {
  apelido: string;
  onCancelar: () => void;
  onConfirmar: () => void;
};

export const ModalDeixarDeSeguir = ({ apelido, onCancelar, onConfirmar }: Props) => {
  const cartaoRef = useFocoModal(onCancelar);

  return (
    <div className={styles.overlay} onClick={onCancelar}>
      <div
        ref={cartaoRef}
        className={styles.cartaoModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-deixar-seguir"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id="titulo-deixar-seguir" className={styles.tituloModal}>
          Deixar de seguir {apelido}?
        </h2>
        <div className={styles.acoesModal}>
          <button type="button" className={styles.botaoConfirmarModal} onClick={onConfirmar}>
            Deixar de seguir
          </button>
          <button
            type="button"
            className={styles.botaoCancelarModal}
            onClick={onCancelar}
            data-foco-inicial
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
