"use client";

import { useState, type UIEvent } from "react";
import { VisualizadorFotos } from "@/components/fotos/VisualizadorFotos";
import styles from "./faixa-fotos-telemetria.module.css";

type Props = {
  fotosUrls: string[];
};

export const FaixaFotosTelemetria = ({ fotosUrls }: Props) => {
  const [atual, setAtual] = useState(0);
  const [aberta, setAberta] = useState<number | null>(null);

  if (fotosUrls.length === 0) return null;

  if (fotosUrls.length === 1) {
    return (
      <div className={styles.faixa}>
        <button
          type="button"
          className={styles.abrirFoto}
          aria-label="Ver foto do passeio inteira"
          onClick={() => setAberta(0)}
        >
          <img src={fotosUrls[0]} alt="Foto do passeio" className={styles.foto} />
        </button>
        {aberta != null ? (
          <VisualizadorFotos
            fotos={fotosUrls}
            indiceInicial={aberta}
            rotulo="Fotos do passeio"
            onFechar={() => setAberta(null)}
          />
        ) : null}
      </div>
    );
  }

  const aoRolar = (evento: UIEvent<HTMLDivElement>) => {
    const alvo = evento.currentTarget;
    if (alvo.clientWidth === 0) return;
    setAtual(Math.round(alvo.scrollLeft / alvo.clientWidth));
  };

  return (
    <div className={styles.faixa}>
      <div
        className={styles.trilho}
        onScroll={aoRolar}
        role="region"
        aria-label={`Fotos do passeio, ${fotosUrls.length} fotos`}
        tabIndex={0}
      >
        {fotosUrls.map((url, indice) => (
          <button
            key={url}
            type="button"
            className={styles.abrirFoto}
            aria-label={`Abrir foto ${indice + 1} de ${fotosUrls.length}`}
            onClick={() => setAberta(indice)}
          >
            <img
              src={url}
              alt={`Foto ${indice + 1} de ${fotosUrls.length}`}
              className={styles.foto}
              loading={indice === 0 ? "eager" : "lazy"}
            />
          </button>
        ))}
      </div>
      <span className={styles.contador} aria-hidden>
        {atual + 1}/{fotosUrls.length}
      </span>
      {aberta != null ? (
        <VisualizadorFotos
          fotos={fotosUrls}
          indiceInicial={aberta}
          rotulo="Fotos do passeio"
          onFechar={() => setAberta(null)}
        />
      ) : null}
    </div>
  );
};
