"use client";

import { OPCOES_RAIO } from "../constants";
import type { RaioKm } from "../types";
import { CampoBusca } from "./CampoBusca";
import styles from "../feed.module.css";

type Props = {
  busca: string;
  onBusca: (valor: string) => void;
  raioKm: RaioKm;
  onCiclarRaio: () => void;
};

export const BarraBuscaRaio = ({
  busca,
  onBusca,
  raioKm,
  onCiclarRaio,
}: Props) => {
  const pill =
    OPCOES_RAIO.find((opcao) => opcao.valor === raioKm)?.pill ?? "TODOS";

  return (
    <section className={styles.barraBuscaRaio}>
      <CampoBusca valor={busca} onChange={onBusca} />
      <button
        type="button"
        className={styles.pillRaio}
        onClick={onCiclarRaio}
        aria-label={`Raio atual: ${pill}. Toque para alterar`}
      >
        <span className="material-symbols-outlined" aria-hidden>
          radar
        </span>
        <span className={styles.pillRaioTexto}>{pill}</span>
      </button>
    </section>
  );
};
