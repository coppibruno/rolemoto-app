"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import { ERRO_LINK_INGRESSO, MODAL_INGRESSO } from "../constants";
import styles from "./modal-ingresso-evento.module.css";

type Props = {
  etapa: "compra" | "confirmar";
  enviando?: boolean;
  linkIngresso: string | null;
  onComprar: () => void;
  onConfirmar: () => void;
  onFechar: () => void;
};

export const ModalIngressoEvento = ({
  etapa,
  enviando,
  linkIngresso,
  onComprar,
  onConfirmar,
  onFechar,
}: Props) => {
  const cartaoRef = useFocoModal(onFechar);
  const confirmar = etapa === "confirmar";

  const irParaCompra = () => {
    if (!linkIngresso) {
      window.alert(ERRO_LINK_INGRESSO);
      return;
    }
    onComprar();
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
          {confirmar ? MODAL_INGRESSO.confirmarTitulo : MODAL_INGRESSO.titulo}
        </h2>
        <p id="descricao-modal-ingresso" className={styles.corpo}>
          {confirmar ? MODAL_INGRESSO.confirmarCorpo : MODAL_INGRESSO.corpo}
        </p>
        <div className={styles.acoes}>
          {confirmar ? (
            <>
              <button
                type="button"
                className={styles.botaoPrimario}
                onClick={onConfirmar}
                disabled={enviando}
                aria-busy={enviando}
                data-foco-inicial
              >
                {enviando ? "Confirmando…" : MODAL_INGRESSO.jaComprei}
              </button>
              <button
                type="button"
                className={styles.botaoSecundario}
                onClick={onFechar}
                disabled={enviando}
              >
                {MODAL_INGRESSO.aindaNao}
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
