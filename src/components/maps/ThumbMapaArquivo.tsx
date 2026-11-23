"use client";

import { MapaEstatico } from "@/components/maps/MapaEstatico";
import styles from "./thumb-mapa-arquivo.module.css";

type Ponto = { lat: number; lng: number };

type Props = {
  fotoUrl?: string | null;
  pontoA?: Ponto | null;
  pontoB?: Ponto | null;
  iconeFallback?: string;
  ariaLabel?: string;
  className?: string;
};

const pontoValido = (p?: Ponto | null): p is Ponto =>
  Boolean(
    p &&
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lng) &&
      !(p.lat === 0 && p.lng === 0),
  );

/** Thumb de foto; sem foto, mapa A→B (só telemetria). */
export const ThumbMapaArquivo = ({
  fotoUrl,
  pontoA,
  pontoB,
  iconeFallback = "speed",
  ariaLabel,
  className,
}: Props) => {
  const foto = (fotoUrl ?? "").trim();
  const a = pontoValido(pontoA) ? pontoA : null;
  const b = pontoValido(pontoB) ? pontoB : a;
  const classes = className ? `${styles.thumb} ${className}` : styles.thumb;

  if (foto) {
    return (
      <span className={classes}>
        <img src={foto} alt="" />
      </span>
    );
  }

  if (a && b) {
    const mesmoPonto = a.lat === b.lat && a.lng === b.lng;
    return (
      <span className={classes} aria-label={ariaLabel}>
        <MapaEstatico
          className={styles.mapa}
          aria-label={ariaLabel ?? "Mapa do trajeto"}
          ligarMarcadores={!mesmoPonto}
          marcadores={
            mesmoPonto
              ? [{ ...a, cor: "var(--primary-container)", rotulo: "A" }]
              : [
                  { ...a, cor: "var(--tertiary)", rotulo: "A" },
                  { ...b, cor: "var(--primary-container)", rotulo: "B" },
                ]
          }
        />
      </span>
    );
  }

  return (
    <span className={classes}>
      <span className={`material-symbols-outlined ${styles.icone}`} aria-hidden>
        {iconeFallback}
      </span>
    </span>
  );
};
