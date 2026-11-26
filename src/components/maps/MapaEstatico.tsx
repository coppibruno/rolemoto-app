"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
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
  /** Hex ou `var(--token)`. */
  cor: string;
  rotulo?: string;
  /** Material Symbol; com ícone o marcador vira botão quando há `onToque`. */
  icone?: string;
  nomeAcessivel?: string;
  onToque?: () => void;
  /** Aparece/some sem reenquadrar o mapa (ex.: pin de inspeção de velocidade). */
  efemero?: boolean;
  /** Empilha o marcador acima dos demais no Google Maps. */
  zIndex?: number;
};

export const marcadorComIcone = (m: MarcadorMapa): boolean => Boolean(m.icone);

export type PropsMapaEstatico = {
  marcadores: MarcadorMapa[];
  /** Se omitido, calcula zoom para caber todos os marcadores. */
  zoom?: number;
  className?: string;
  /** Desenha linha reta entre o 1º e o 2º marcador (ex.: telemetria A→B). */
  ligarMarcadores?: boolean;
  /** Caminho percorrido; com 2+ pontos substitui a linha reta e entra no enquadramento. */
  trajeto?: PontoLatLng[];
  /**
   * Cor de cada segmento do trajeto (length = trajeto.length - 1).
   * Só o mapa Google interativo usa; OSM/estático ignora e segue laranja.
   */
  trajetoCores?: string[];
  /** Toque no caminho (ponto clicado; o pai resolve o vértice). */
  onTocarTrajeto?: (ponto: PontoLatLng) => void;
  "aria-label"?: string;
};

type TileInfo = { key: string; z: number; x: number; y: number; left: number; top: number };

type Layout = {
  zoom: number;
  tiles: TileInfo[];
  mosaicoLeft: number;
  mosaicoTop: number;
  marcadoresPx: Array<{
    left: number;
    top: number;
    cor: string;
    rotulo?: string;
    icone?: string;
    nomeAcessivel?: string;
  }>;
  /** Atributo `points` do `<polyline>`; "" sem trajeto. */
  trajetoPx: string;
  /** Pixels dos vértices do trajeto (hit-test do toque). */
  trajetoPontosPx: Array<{ left: number; top: number }>;
};

const layoutMapa = (
  marcadores: MarcadorMapa[],
  trajeto: PontoLatLng[],
  width: number,
  height: number,
  zoomFixo?: number,
): Layout | null => {
  if (width <= 0 || height <= 0 || marcadores.length === 0) return null;

  const enquadrar: PontoLatLng[] =
    trajeto.length >= 2 ? [...marcadores, ...trajeto] : marcadores;
  const zoom =
    zoomFixo ??
    zoomParaEnquadrar(
      enquadrar,
      width,
      height,
      enquadrar.length > 1 ? 48 : 24,
    );
  const centro = centroPixelDosPontos(enquadrar, zoom);
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
      icone: m.icone,
      nomeAcessivel: m.nomeAcessivel,
    };
  });

  const trajetoPontosPx =
    trajeto.length >= 2
      ? trajeto.map((p) => {
          const g = latLngParaPixelGlobal(p.lat, p.lng, zoom);
          return { left: g.x - origemX, top: g.y - origemY };
        })
      : [];
  const trajetoPx =
    trajetoPontosPx.length >= 2
      ? trajetoPontosPx
          .map((p) => `${p.left.toFixed(1)},${p.top.toFixed(1)}`)
          .join(" ")
      : "";

  return {
    zoom,
    tiles,
    mosaicoLeft,
    mosaicoTop,
    marcadoresPx,
    trajetoPx,
    trajetoPontosPx,
  };
};

const SEM_TRAJETO: PontoLatLng[] = [];

export const MapaEstatico = ({
  marcadores,
  zoom,
  className,
  ligarMarcadores = false,
  trajeto = SEM_TRAJETO,
  onTocarTrajeto,
  "aria-label": ariaLabel = "Mapa",
}: PropsMapaEstatico) => {
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
    () => layoutMapa(marcadores, trajeto, tamanho.w, tamanho.h, zoom),
    [marcadores, trajeto, tamanho.w, tamanho.h, zoom],
  );

  const linha =
    ligarMarcadores && layout && !layout.trajetoPx && layout.marcadoresPx.length >= 2
      ? {
          x1: layout.marcadoresPx[0].left,
          y1: layout.marcadoresPx[0].top,
          x2: layout.marcadoresPx[1].left,
          y2: layout.marcadoresPx[1].top,
        }
      : null;

  const trajetoClicavel =
    Boolean(onTocarTrajeto) && trajeto.length >= 2 && Boolean(layout?.trajetoPx);
  const interativo =
    marcadores.some((m) => m.icone && m.onToque) || trajetoClicavel;

  const aoTocarMapa = (evento: MouseEvent<HTMLDivElement>) => {
    if (!onTocarTrajeto || !layout || trajeto.length < 2) return;
    const alvo = evento.target as HTMLElement | null;
    if (alvo?.closest("button, a")) return;
    const rect = evento.currentTarget.getBoundingClientRect();
    const x = evento.clientX - rect.left;
    const y = evento.clientY - rect.top;
    let melhor = 0;
    let menor = Number.POSITIVE_INFINITY;
    for (let i = 0; i < layout.trajetoPontosPx.length; i += 1) {
      const p = layout.trajetoPontosPx[i];
      const d = Math.hypot(p.left - x, p.top - y);
      if (d < menor) {
        menor = d;
        melhor = i;
      }
    }
    /** Toque longe do caminho não conta (≈ 28 px). */
    if (menor > 28) return;
    onTocarTrajeto(trajeto[melhor]);
  };

  return (
    <div
      ref={setHost}
      className={[styles.viewport, className].filter(Boolean).join(" ")}
      role={interativo ? "group" : "img"}
      aria-label={ariaLabel}
      onClick={trajetoClicavel ? aoTocarMapa : undefined}
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
          {layout.trajetoPx ? (
            <svg className={styles.overlaySvg} aria-hidden>
              <polyline
                points={layout.trajetoPx}
                fill="none"
                stroke="#121316"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.45}
              />
              <polyline
                points={layout.trajetoPx}
                fill="none"
                stroke="#f97316"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
          {layout.marcadoresPx.map((m, i) => {
            const chave = `${m.left}-${m.top}-${i}`;
            if (m.icone) {
              const aoTocar = marcadores[i]?.onToque;
              const icone = (
                <span className={styles.marcadorIconeCirculo} style={{ color: m.cor }}>
                  <span className="material-symbols-outlined" aria-hidden>
                    {m.icone}
                  </span>
                </span>
              );
              return aoTocar ? (
                <button
                  key={chave}
                  type="button"
                  className={styles.marcadorIcone}
                  style={{ left: m.left, top: m.top }}
                  aria-label={m.nomeAcessivel}
                  onClick={aoTocar}
                >
                  {icone}
                </button>
              ) : (
                <span
                  key={chave}
                  className={styles.marcadorIcone}
                  style={{ left: m.left, top: m.top }}
                  aria-hidden
                >
                  {icone}
                </span>
              );
            }
            return (
              <div
                key={chave}
                className={styles.marcador}
                style={{ left: m.left, top: m.top, background: m.cor }}
              >
                {m.rotulo ? <span className={styles.rotulo}>{m.rotulo}</span> : null}
              </div>
            );
          })}
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
