import { LABELS_TIPO_OFERTA } from "@/lib/oferta-local";
import type { TipoOfertaLocal } from "@/types/oferta-local";
import styles from "../../ofertas.module.css";

const TIPOS: TipoOfertaLocal[] = ["preco", "percentual", "brinde"];

type Props = {
  valor: TipoOfertaLocal;
  onChange: (tipo: TipoOfertaLocal) => void;
};

export const SegmentoTipoOferta = ({ valor, onChange }: Props) => (
  <div className={styles.segmento} role="radiogroup" aria-label="Tipo da oferta">
    {TIPOS.map((tipo) => (
      <button
        key={tipo}
        type="button"
        role="radio"
        aria-checked={valor === tipo}
        className={`${styles.chip} ${valor === tipo ? styles.chipAtivo : ""}`}
        onClick={() => onChange(tipo)}
      >
        {LABELS_TIPO_OFERTA[tipo]}
      </button>
    ))}
  </div>
);
