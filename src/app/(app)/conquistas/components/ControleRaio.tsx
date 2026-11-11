"use client";

import { RAIO_MAX_M, RAIO_MIN_M, RAIO_PASSO_M } from "../constants";
import styles from "../conquistas.module.css";

type Props = {
  valor: number;
  onMudar: (metros: number) => void;
  desabilitado?: boolean;
};

export const ControleRaio = ({ valor, onMudar, desabilitado }: Props) => (
  <div className={styles.raio}>
    <div className={styles.raioTopo}>
      <label htmlFor="raio-conquista" className={styles.label}>
        Raio
      </label>
      <span className={styles.raioValor}>{valor} m</span>
    </div>
    <input
      id="raio-conquista"
      type="range"
      className={styles.slider}
      min={RAIO_MIN_M}
      max={RAIO_MAX_M}
      step={RAIO_PASSO_M}
      value={valor}
      onChange={(e) => onMudar(Number(e.target.value))}
      disabled={desabilitado}
    />
  </div>
);
