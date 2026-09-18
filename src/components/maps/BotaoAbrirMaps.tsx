"use client";

import { urlAbrirMaps, type PontoMaps } from "@/lib/maps";
import styles from "./botao-abrir-maps.module.css";

type Props = {
  ponto: PontoMaps;
  /** Visível: "Abrir no Maps" | "Ver partida" | "Ver destino" */
  label?: string;
  /** icone = só ícone 48×48; default = ícone + texto */
  variante?: "texto" | "icone";
  className?: string;
  /** Se informado (ex.: linkMaps do catálogo), usa no lugar de `urlAbrirMaps`. */
  href?: string;
};

export const BotaoAbrirMaps = ({
  ponto,
  label = "Abrir no Maps",
  variante = "texto",
  className,
  href,
}: Props) => {
  const temCoord =
    typeof ponto.lat === "number" &&
    typeof ponto.lng === "number" &&
    Number.isFinite(ponto.lat) &&
    Number.isFinite(ponto.lng);
  const enderecoOk = ponto.endereco.trim().length > 0;

  if (!href?.trim() && !temCoord && !enderecoOk) {
    return null;
  }

  const rotulo = ponto.nome?.trim() || ponto.endereco.trim() || "local";
  const ariaLabel = `Abrir ${rotulo} no Maps`;
  const classes = [
    styles.botao,
    variante === "icone" ? styles.icone : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const destino = href?.trim() || urlAbrirMaps(ponto);

  return (
    <a
      href={destino}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="material-symbols-outlined" aria-hidden>
        map
      </span>
      {variante === "texto" ? label : null}
    </a>
  );
};
