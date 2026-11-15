"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { LimiteFalhaMapa } from "./LimiteFalhaMapa";
import styles from "../mapa.module.css";

const MapaPacote = dynamic(() => import("./MapaPacote").then((m) => m.MapaPacote), {
  ssr: false,
  loading: () => <div className={styles.mapaPacote} aria-hidden />,
});

type Props = ComponentProps<typeof MapaPacote>;

/** Mapa do pacote em chunk próprio e cercado: qualquer falha volta para o mapa online. */
export const MapaPacoteSeguro = (props: Props) => (
  <LimiteFalhaMapa aoFalhar={props.aoFalhar}>
    <MapaPacote {...props} />
  </LimiteFalhaMapa>
);
