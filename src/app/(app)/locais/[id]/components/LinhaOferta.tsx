import { janelaLongaOferta } from "@/lib/oferta-local";
import type { OfertaLocal } from "@/types/oferta-local";
import styles from "../ofertas.module.css";

type Props = {
  oferta: OfertaLocal;
  onAbrir: (oferta: OfertaLocal) => void;
};

export const LinhaOferta = ({ oferta, onAbrir }: Props) => {
  const conteudo = (
    <>
      <strong className={styles.linhaTitulo}>{oferta.titulo}</strong>
      <span className={styles.linhaRotulo}>{oferta.rotulo}</span>
      <small className={styles.linhaJanela}>
        {janelaLongaOferta(oferta)}
        {oferta.tetoDia ? ` · até ${oferta.tetoDia} por dia` : ""}
      </small>
    </>
  );

  if (!oferta.vigente) {
    return <li className={`${styles.linhaOferta} ${styles.linhaForaDoAr}`}>{conteudo}</li>;
  }

  return (
    <li>
      <button
        type="button"
        className={`${styles.linhaOferta} ${styles.linhaNoAr}`}
        onClick={() => onAbrir(oferta)}
        aria-label={`Abrir cupom: ${oferta.titulo}, ${oferta.rotulo}`}
      >
        {conteudo}
      </button>
    </li>
  );
};
