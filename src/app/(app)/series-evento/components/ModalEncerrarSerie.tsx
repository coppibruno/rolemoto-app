"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import styles from "../series-evento.module.css";

type Props = {
  titulo: string;
  enviando: boolean;
  onFechar: () => void;
  onConfirmar: () => void;
};

export const ModalEncerrarSerie = ({
  titulo,
  enviando,
  onFechar,
  onConfirmar,
}: Props) => {
  const cartaoRef = useFocoModal(onFechar);

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        ref={cartaoRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-encerrar-serie"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id="titulo-encerrar-serie" className={styles.modalTitulo}>
          Encerrar encontro
        </h2>
        <p className={styles.apoio}>
          {titulo} deixa de gerar novas datas. Quem já se inscreveu continua vendo
          a data, marcada como cancelada.
        </p>
        <button
          type="button"
          className={styles.cta}
          onClick={onConfirmar}
          disabled={enviando}
        >
          {enviando ? "Encerrando..." : "Encerrar encontro"}
        </button>
        <button
          type="button"
          className={styles.botao}
          onClick={onFechar}
          disabled={enviando}
          data-foco-inicial
        >
          Manter encontro
        </button>
      </div>
    </div>
  );
};
