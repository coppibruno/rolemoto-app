"use client";

import dynamic from "next/dynamic";
import type { PropsMapaSelecaoLocal } from "./MapaSelecaoLocal";
import { useMapaSelecaoGoogle } from "./useMapaSelecaoGoogle";
import styles from "./mapa-selecao-local.module.css";

const MapaLeaflet = dynamic(
  () => import("./MapaSelecaoLocal").then((m) => m.MapaSelecaoLocal),
  { ssr: false },
);

export const MapaSelecaoGoogle = ({
  lat,
  lng,
  vooId,
  onMoverPonto,
  desabilitado,
  className,
  hintVazio = "Toque no mapa ou busque o endereço",
  hintAjuste = "Arraste o alfinete para ajustar o ponto",
}: PropsMapaSelecaoLocal) => {
  const { containerRef, pronto, falhou } = useMapaSelecaoGoogle({
    lat,
    lng,
    vooId,
    onMoverPonto,
    desabilitado,
  });

  if (falhou) {
    return (
      <MapaLeaflet
        lat={lat}
        lng={lng}
        vooId={vooId}
        onMoverPonto={onMoverPonto}
        desabilitado={desabilitado}
        className={className}
        hintVazio={hintVazio}
        hintAjuste={hintAjuste}
      />
    );
  }

  const temPonto = lat != null && lng != null;

  return (
    <div className={[styles.mapa, className].filter(Boolean).join(" ")}>
      <div ref={containerRef} className={styles.google} />
      {pronto ? null : (
        <div className={styles.carregando} role="status">
          Carregando mapa…
        </div>
      )}
      <div className={`${styles.hint} ${styles.hintGoogle}`} role="status">
        <span className={`material-symbols-outlined ${styles.hintIcone}`} aria-hidden>
          {temPonto ? "open_with" : "touch_app"}
        </span>
        {temPonto ? hintAjuste : hintVazio}
      </div>
    </div>
  );
};
