"use client";

import { MapaEstatico, type PropsMapaEstatico } from "./MapaEstatico";
import { useMapaLeituraGoogle } from "./useMapaLeituraGoogle";
import styles from "./mapa-estatico.module.css";

export const MapaLeituraGoogle = ({
  marcadores,
  zoom,
  className,
  ligarMarcadores = false,
  trajeto,
  "aria-label": ariaLabel = "Mapa",
}: PropsMapaEstatico) => {
  const { containerRef, pronto, falhou } = useMapaLeituraGoogle({
    marcadores,
    zoom,
    ligarMarcadores,
    trajeto,
  });

  if (falhou) {
    return (
      <MapaEstatico
        marcadores={marcadores}
        zoom={zoom}
        className={className}
        ligarMarcadores={ligarMarcadores}
        trajeto={trajeto}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <div
      className={[styles.viewport, styles.viewportGoogle, className]
        .filter(Boolean)
        .join(" ")}
      role={marcadores.some((m) => m.icone && m.onToque) ? "group" : "img"}
      aria-label={ariaLabel}
    >
      <div ref={containerRef} className={styles.google} />
      {pronto ? null : (
        <div className={styles.carregando} role="status">
          Carregando mapa…
        </div>
      )}
    </div>
  );
};
