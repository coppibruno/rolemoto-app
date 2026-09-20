"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TAMANHO_TILE,
  centroPixelDosPontos,
  latLngParaPixelGlobal,
  urlTileOsm,
  zoomParaEnquadrar,
  type PontoLatLng,
} from "@/lib/mapa-tiles";
import styles from "./mapa-estatico.module.css";

export type MarcadorMapa = PontoLatLng & {
  cor: string;
  rotulo?: string;
};

type Props = {
  marcadores: MarcadorMapa[];
  /** Se omitido, calcula zoom para caber todos os marcadores. */
  zoom?: number;
  className?: string;
  /** Desenha linha reta entre o 1º e o 2º marcador (ex.: telemetria A→B). */
  ligarMarcadores?: boolean;
  "aria-label"?: string;
};

type TileInfo = { key: string; z: number; x: number; y: number; left: number; top: number };

type Layout = {
  zoom: number;
  tiles: TileInfo[];
  mosaicoLeft: number;
  mosaicoTop: number;
  marcadoresPx: Array<{ left: number; top: number; cor: string; rotulo?: string }>;
};

const layoutMapa = (
  marcadores: MarcadorMapa[],
  width: number,
  height: number,
  zoomFixo?: number,
): Layout | null => {
  if (width <= 0 || height <= 0 || marcadores.length === 0) return null;

  const zoom =
    zoomFixo ??
    zoomParaEnquadrar(
      marcadores,
      width,
      height,
      marcadores.length > 1 ? 48 : 24,
    );
  const centro = centroPixelDosPontos(marcadores, zoom);
  const origemX = centro.x - width / 2;
  const origemY = centro.y - height / 2;

  const tileX0 = Math.floor(origemX / TAMANHO_TILE);
  const tileY0 = Math.floor(origemY / TAMANHO_TILE);
  const tileX1 = Math.floor((origemX + width) / TAMANHO_TILE);
  const tileY1 = Math.floor((origemY + height) / TAMANHO_TILE);
  const maxTile = 2 ** zoom - 1;

  const mosaicoLeft = tileX0 * TAMANHO_TILE - origemX;
  const mosaicoTop = tileY0 * TAMANHO_TILE - origemY;

  const tiles: TileInfo[] = [];
  for (let ty = tileY0; ty <= tileY1; ty += 1) {
    if (ty < 0 || ty > maxTile) continue;
    for (let tx = tileX0; tx <= tileX1; tx += 1) {
      tiles.push({
        key: `${zoom}/${tx}/${ty}`,
        z: zoom,
        x: tx,
        y: ty,
        left: (tx - tileX0) * TAMANHO_TILE,
        top: (ty - tileY0) * TAMANHO_TILE,
      });
    }
  }

  const marcadoresPx = marcadores.map((m) => {
    const p = latLngParaPixelGlobal(m.lat, m.lng, zoom);
    return {
      left: p.x - origemX,
      top: p.y - origemY,
      cor: m.cor,
      rotulo: m.rotulo,
    };
  });

  return { zoom, tiles, mosaicoLeft, mosaicoTop, marcadoresPx };
};

export const MapaEstatico = ({
  marcadores,
  zoom,
  className,
  ligarMarcadores = false,
  "aria-label": ariaLabel = "Mapa",
}: Props) => {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [tamanho, setTamanho] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!host) return;
    const medir = () => {
      const rect = host.getBoundingClientRect();
      setTamanho({ w: Math.round(rect.width), h: Math.round(rect.height) });
    };
    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(host);
    return () => observer.disconnect();
  }, [host]);

  const layout = useMemo(
    () => layoutMapa(marcadores, tamanho.w, tamanho.h, zoom),
    [marcadores, tamanho.w, tamanho.h, zoom],
  );

  const linha =
    ligarMarcadores && layout && layout.marcadoresPx.length >= 2
      ? {
          x1: layout.marcadoresPx[0].left,
          y1: layout.marcadoresPx[0].top,
          x2: layout.marcadoresPx[1].left,
          y2: layout.marcadoresPx[1].top,
        }
      : null;

  return (
    <div
      ref={setHost}
      className={[styles.viewport, className].filter(Boolean).join(" ")}
      role="img"
      aria-label={ariaLabel}
    >
      {layout ? (
        <>
          <div
            className={styles.mosaico}
            style={{ left: layout.mosaicoLeft, top: layout.mosaicoTop }}
          >
            {layout.tiles.map((t) => (
              <img
                key={t.key}
                src={urlTileOsm(t.z, t.x, t.y)}
                alt=""
                draggable={false}
                className={styles.tile}
                style={{ left: t.left, top: t.top }}
              />
            ))}
          </div>
          {linha ? (
            <svg className={styles.overlaySvg} aria-hidden>
              <line
                x1={linha.x1}
                y1={linha.y1}
                x2={linha.x2}
                y2={linha.y2}
                stroke="#f97316"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="6 5"
                opacity={0.9}
              />
            </svg>
          ) : null}
          {layout.marcadoresPx.map((m, i) => (
            <div
              key={`${m.left}-${m.top}-${i}`}
              className={styles.marcador}
              style={{ left: m.left, top: m.top, background: m.cor }}
            >
              {m.rotulo ? <span className={styles.rotulo}>{m.rotulo}</span> : null}
            </div>
          ))}
        </>
      ) : null}
      <a
        className={styles.atribuicao}
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
      >
        © OpenStreetMap
      </a>
    </div>
  );
};
