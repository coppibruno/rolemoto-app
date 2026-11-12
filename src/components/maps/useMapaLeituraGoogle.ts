"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  carregarGoogleMaps,
  chaveGoogleMaps,
  ESTILO_MAPA_ESCURO,
  iconeCirculo,
  iconePin,
  observarFalhaAuthGoogle,
  type GoogleMap,
  type GoogleMapsNs,
  type LatLng,
  type OverlayMapa,
} from "@/lib/google-maps";
import type { PontoLatLng } from "@/lib/mapa-tiles";
import { marcadorComIcone, type MarcadorMapa } from "./MapaEstatico";

const ZOOM_PONTO = 15;

type Args = {
  marcadores: MarcadorMapa[];
  zoom?: number;
  ligarMarcadores?: boolean;
  trajeto?: PontoLatLng[];
};

type DadosMapa = Args;

const caminhoDoMapa = ({
  marcadores,
  ligarMarcadores,
  trajeto,
}: DadosMapa): LatLng[] => {
  if (trajeto && trajeto.length >= 2) return trajeto;
  const pontos = marcadores.filter((m) => !marcadorComIcone(m));
  if (ligarMarcadores && pontos.length >= 2) {
    return pontos.map((m) => ({ lat: m.lat, lng: m.lng }));
  }
  return [];
};

/** O Google pede cor literal; `var(--token)` é lido do tema ativo. */
const resolverCor = (cor: string): string => {
  const token = /^var\((--[\w-]+)\)$/.exec(cor.trim())?.[1];
  if (!token || typeof document === "undefined") return cor;
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || "#f97316";
};

const desenhar = (
  map: GoogleMap,
  maps: GoogleMapsNs,
  dados: DadosMapa,
  tocar: (indice: number) => void,
): { overlays: OverlayMapa[]; enquadrar: () => void } => {
  const overlays: OverlayMapa[] = [];
  const limites = new maps.LatLngBounds();
  const pontos: LatLng[] = [];

  dados.marcadores.forEach((marcador, indice) => {
    const posicao = { lat: marcador.lat, lng: marcador.lng };
    pontos.push(posicao);
    limites.extend(posicao);
    if (marcador.icone) {
      const cor = resolverCor(marcador.cor);
      const clicavel = Boolean(marcador.onToque);
      const medalha = new maps.Marker({
        map,
        position: posicao,
        clickable: clicavel,
        title: marcador.nomeAcessivel,
        zIndex: 10,
        icon: { ...iconeCirculo("#121316"), scale: 15, strokeColor: cor },
        label: {
          text: marcador.icone,
          className: "material-symbols-outlined",
          fontFamily: "Material Symbols Outlined",
          color: cor,
          fontSize: "18px",
        },
      });
      if (clicavel) maps.event.addListener(medalha, "click", () => tocar(indice));
      overlays.push(medalha);
      return;
    }
    const marker = new maps.Marker({
      map,
      position: posicao,
      clickable: false,
      icon: marcador.rotulo ? iconeCirculo(marcador.cor) : iconePin(maps),
      label: marcador.rotulo
        ? {
            text: marcador.rotulo,
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "700",
          }
        : undefined,
    });
    overlays.push(marker);
  });

  const caminho = caminhoDoMapa(dados);
  const tracejado = !(dados.trajeto && dados.trajeto.length >= 2);
  if (caminho.length >= 2) {
    caminho.forEach((ponto) => limites.extend(ponto));
    overlays.push(
      new maps.Polyline({
        map,
        path: caminho,
        geodesic: true,
        strokeColor: "#f97316",
        strokeOpacity: tracejado ? 0 : 0.95,
        strokeWeight: 4,
        ...(tracejado
          ? {
              icons: [
                {
                  icon: {
                    path: "M 0,-1 0,1",
                    strokeOpacity: 1,
                    strokeColor: "#f97316",
                    scale: 3,
                  },
                  offset: "0",
                  repeat: "12px",
                },
              ],
            }
          : {}),
      }),
    );
  }

  const enquadrar = () => {
    if (pontos.length === 0) return;
    if (dados.zoom != null || pontos.length === 1) {
      map.setCenter(pontos[0]);
      map.setZoom(dados.zoom ?? ZOOM_PONTO);
      return;
    }
    map.fitBounds(limites, 40);
  };
  enquadrar();

  return { overlays, enquadrar };
};

export const useMapaLeituraGoogle = ({
  marcadores,
  zoom,
  ligarMarcadores,
  trajeto,
}: Args) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const mapsRef = useRef<GoogleMapsNs | null>(null);
  const overlaysRef = useRef<OverlayMapa[]>([]);
  const enquadrarRef = useRef<(() => void) | null>(null);
  const dadosRef = useRef<DadosMapa>({ marcadores, zoom, ligarMarcadores, trajeto });
  const [pronto, setPronto] = useState(false);
  const [falhou, setFalhou] = useState(false);

  dadosRef.current = { marcadores, zoom, ligarMarcadores, trajeto };

  const assinatura = useMemo(
    () =>
      JSON.stringify({
        m: marcadores.map((p) => [
          p.lat,
          p.lng,
          p.cor,
          p.rotulo ?? "",
          p.icone ?? "",
          p.nomeAcessivel ?? "",
          Boolean(p.onToque),
        ]),
        z: zoom ?? null,
        l: Boolean(ligarMarcadores),
        t: (trajeto ?? []).map((p) => [p.lat, p.lng]),
      }),
    [ligarMarcadores, marcadores, trajeto, zoom],
  );

  useEffect(() => {
    const el = containerRef.current;
    const chave = chaveGoogleMaps();
    if (!el || !chave) return;

    let cancelado = false;
    let observar: ResizeObserver | null = null;
    const pararAuth = observarFalhaAuthGoogle(() => {
      if (!cancelado) setFalhou(true);
    });

    void carregarGoogleMaps(chave)
      .then((maps) => {
        if (cancelado) return;
        mapsRef.current = maps;
        const primeiro = dadosRef.current.marcadores[0];
        const map = new maps.Map(el, {
          center: primeiro
            ? { lat: primeiro.lat, lng: primeiro.lng }
            : { lat: -27.5, lng: -51 },
          zoom: ZOOM_PONTO,
          styles: ESTILO_MAPA_ESCURO,
          backgroundColor: "#1a1c20",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "cooperative",
          keyboardShortcuts: false,
        });
        mapRef.current = map;

        observar = new ResizeObserver(() => {
          maps.event.trigger(map, "resize");
          enquadrarRef.current?.();
        });
        observar.observe(el);
        setPronto(true);
      })
      .catch(() => {
        if (!cancelado) setFalhou(true);
      });

    return () => {
      cancelado = true;
      pararAuth();
      observar?.disconnect();
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
      enquadrarRef.current = null;
      mapRef.current = null;
      mapsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps || !pronto) return;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    const desenho = desenhar(map, maps, dadosRef.current, (indice) =>
      dadosRef.current.marcadores[indice]?.onToque?.(),
    );
    overlaysRef.current = desenho.overlays;
    enquadrarRef.current = desenho.enquadrar;
  }, [assinatura, pronto]);

  return { containerRef, pronto, falhou };
};
