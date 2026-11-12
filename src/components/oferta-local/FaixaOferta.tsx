import { janelaCurtaOferta } from "@/lib/oferta-local";
import type { OfertaVigenteResumo } from "@/types/oferta-local";
import styles from "./oferta-local.module.css";

type Props = {
  oferta: OfertaVigenteResumo;
};

export const FaixaOferta = ({ oferta }: Props) => (
  <div className={styles.faixa}>
    <div className={styles.faixaTexto}>
      <strong className={styles.faixaTitulo}>{oferta.titulo}</strong>
      <span className={styles.faixaJanela}>{janelaCurtaOferta(oferta)}</span>
    </div>
    <span className={styles.faixaRotulo}>{oferta.rotulo}</span>
  </div>
);
