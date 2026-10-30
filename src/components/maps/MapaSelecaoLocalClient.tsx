"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { chaveGoogleMaps } from "@/lib/google-maps";
import { reservarCargaMapa } from "@/lib/reservar-carga-mapa";
import styles from "./mapa-selecao-local.module.css";
import type { PropsMapaSelecaoLocal } from "./MapaSelecaoLocal";

const Carregando = () => (
  <div className={styles.placeholder} role="status">
    Carregando mapa…
  </div>
);

const MapaLeaflet = dynamic(
  () => import("./MapaSelecaoLocal").then((m) => m.MapaSelecaoLocal),
  { ssr: false, loading: () => <Carregando /> },
);

const MapaGoogle = dynamic(
  () => import("./MapaSelecaoGoogle").then((m) => m.MapaSelecaoGoogle),
  { ssr: false, loading: () => <Carregando /> },
);

type Provedor = "pendente" | "google" | "osm";

const MapaComReserva = (props: PropsMapaSelecaoLocal) => {
  const [provedor, setProvedor] = useState<Provedor>("pendente");

  useEffect(() => {
    let ativo = true;
    // Espera o tick: no dev o React desmonta o efeito na hora e a reserva
    // sairia duas vezes. Em produção o timeout dispara uma vez.
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

  if (provedor === "pendente") return <Carregando />;
  if (provedor === "google") return <MapaGoogle {...props} />;
  return <MapaLeaflet {...props} />;
};

/** Sem chave, ou sem reserva, segue no Leaflet. O Google só entra depois do POST. */
export const MapaSelecaoLocalClient = (props: PropsMapaSelecaoLocal) => {
  if (!chaveGoogleMaps()) return <MapaLeaflet {...props} />;
  return <MapaComReserva {...props} />;
};
