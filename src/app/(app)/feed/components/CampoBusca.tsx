"use client";

import styles from "../feed.module.css";

type Props = {
  valor: string;
  onChange: (valor: string) => void;
};

export const CampoBusca = ({ valor, onChange }: Props) => {
  const irParaFiltros = () => {
    document.getElementById("filtros-feed")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className={styles.buscaWrap}>
      <span className={`${styles.buscaIcone} material-symbols-outlined`} aria-hidden>
        search
      </span>
      <input
        className={styles.buscaInput}
        type="search"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar destino, serra ou motogrupo…"
        aria-label="Buscar destino, serra ou motogrupo"
      />
      <button
        type="button"
        className={styles.botaoTune}
        onClick={irParaFiltros}
        aria-label="Filtros"
        aria-controls="filtros-feed"
      >
        <span className="material-symbols-outlined">tune</span>
      </button>
    </div>
  );
};
