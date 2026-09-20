"use client";

import dynamic from "next/dynamic";
import styles from "./mapa-selecao-local.module.css";
import type { PropsMapaSelecaoLocal } from "./MapaSelecaoLocal";

const MapaSelecaoLocalInterno = dynamic(
  () => import("./MapaSelecaoLocal").then((m) => m.MapaSelecaoLocal),
  {
    ssr: false,
    loading: () => (
      <div className={styles.placeholder} role="status">
        Carregando mapa…
      </div>
    ),
  },
);

/** Wrapper com SSR desligado — Leaflet precisa de `window`. */
export const MapaSelecaoLocalClient = (props: PropsMapaSelecaoLocal) => (
  <MapaSelecaoLocalInterno {...props} />
);
