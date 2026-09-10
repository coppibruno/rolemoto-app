"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import styles from "../login.module.css";

type Props = {
  onFechar: () => void;
};

export const SheetInstalarIos = ({ onFechar }: Props) => {
  const cartaoRef = useFocoModal(onFechar);

  return (
    <div className={styles.overlaySheet} onClick={onFechar}>
      <div
        ref={cartaoRef}
        className={styles.cartaoSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-instalar-ios"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titulo-instalar-ios" className={styles.tituloSheet}>
          Adicionar à tela inicial
        </h2>
        <ol className={styles.passosSheet}>
          <li>
            Toque em <strong>Compartilhar</strong> (ícone quadrado com seta para
            cima) na barra do Safari.
          </li>
          <li>
            Role e toque em <strong>Adicionar à Tela de Início</strong>.
          </li>
          <li>
            Confirme <strong>Adicionar</strong>.
          </li>
        </ol>
        <button
          type="button"
          className={styles.botaoEntendi}
          onClick={onFechar}
          data-foco-inicial
        >
          Entendi
        </button>
      </div>
    </div>
  );
};
