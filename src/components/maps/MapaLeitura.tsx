"use client";

import { useEffect, useState } from "react";
import { chaveGoogleMaps } from "@/lib/google-maps";
import { reservarCargaMapa } from "@/lib/reservar-carga-mapa";
import { MapaEstatico, type PropsMapaEstatico } from "./MapaEstatico";
import { MapaLeituraGoogle } from "./MapaLeituraGoogle";
import styles from "./mapa-estatico.module.css";

type Provedor = "pendente" | "google" | "osm";

const MapaComReserva = (props: PropsMapaEstatico) => {
  const [provedor, setProvedor] = useState<Provedor>("pendente");

  useEffect(() => {
    let ativo = true;
    const id = window.setTimeout(() => {
      void reservarCargaMapa().then((resultado) => {
        if (ativo) setProvedor(resultado);
      });
    }, 0);
    return () => {
      ativo = false;
      window.clearTimeout(id);
    };
  }, []);

  if (provedor === "pendente") {
    return (
      <div
        className={[styles.viewport, styles.viewportGoogle, props.className]
          .filter(Boolean)
          .join(" ")}
        role="status"
        aria-label={props["aria-label"] ?? "Mapa"}
      >
        <div className={styles.carregando}>Carregando mapa…</div>
      </div>
    );
  }

  if (provedor === "google") return <MapaLeituraGoogle {...props} />;
  return <MapaEstatico {...props} />;
};

/** Sem chave, ou com a cota do mês esgotada, segue no mapa livre. */
export const MapaLeitura = (props: PropsMapaEstatico) => {
  if (!chaveGoogleMaps()) return <MapaEstatico {...props} />;
  return <MapaComReserva {...props} />;
};
