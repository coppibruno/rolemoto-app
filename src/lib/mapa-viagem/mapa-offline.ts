import maplibregl from "maplibre-gl";
import { PMTiles, Protocol, type Source } from "pmtiles";
import type { Localizacao } from "@/types/role";
import { COR_TRACO, estiloMapaViagem } from "./estilo-mapa";
import type { PontoNomeado } from "./tipos";
import { ZOOM_PACOTE_MAX, ZOOM_PACOTE_MIN } from "./viagem";

type Dados = {
  fonte: Source;
  pontos: Localizacao[];
  postos: PontoNomeado[];
  cidades: PontoNomeado[];
};

export type MapaOffline = {
  atualizarPosicao: (posicao: { lat: number; lng: number } | null) => void;
  destruir: () => void;
};

let protocolo: Protocol | null = null;

const garantirProtocolo = (): Protocol => {
  if (!protocolo) {
    protocolo = new Protocol();
    maplibregl.addProtocol("pmtiles", protocolo.tile);
  }
  return protocolo;
};

const elemento = (estilo: Partial<CSSStyleDeclaration>, texto = ""): HTMLDivElement => {
  const el = document.createElement("div");
  Object.assign(el.style, estilo);
  el.textContent = texto;
  return el;
};

const PINO: Partial<CSSStyleDeclaration> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "26px",
  height: "26px",
  borderRadius: "9999px",
  border: "2px solid #121316",
  font: "700 13px 'Barlow Condensed', system-ui, sans-serif",
  color: "#121316",
};

const rotuloPonto = (indice: number, total: number): string => {
  if (indice === 0) return "S";
  if (indice === total - 1) return "D";
  return String(indice);
};

/** Mapa MapLibre lendo o `mapa.pmtiles` do aparelho. Pan e zoom não pedem rede. */
export const montarMapaOffline = (container: HTMLElement, dados: Dados): MapaOffline => {
  const arquivo = new PMTiles(dados.fonte);
  garantirProtocolo().add(arquivo);
  const chave = dados.fonte.getKey();

  const limites = new maplibregl.LngLatBounds();
  dados.pontos.forEach((p) => limites.extend([p.lng, p.lat]));

  const mapa = new maplibregl.Map({
    container,
    style: estiloMapaViagem(`pmtiles://${chave}`),
    bounds: limites,
    fitBoundsOptions: { padding: 40, maxZoom: ZOOM_PACOTE_MAX },
    minZoom: ZOOM_PACOTE_MIN - 1,
    maxZoom: ZOOM_PACOTE_MAX + 2,
    attributionControl: { compact: false },
  });

  mapa.on("load", () => {
    mapa.addSource("viagem", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: dados.pontos.map((p) => [p.lng, p.lat]) },
      },
    });
    mapa.addLayer({
      id: "traco-viagem",
      type: "line",
      source: "viagem",
      paint: { "line-color": COR_TRACO, "line-width": 4, "line-dasharray": [2, 1.5] },
    });
  });

  const marcadores: maplibregl.Marker[] = [];
  dados.cidades.forEach((c) => {
    const el = elemento(
      { font: "600 12px system-ui, sans-serif", color: "#c9c6c0", textShadow: "0 1px 2px #000" },
      c.nome,
    );
    marcadores.push(new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).addTo(mapa));
  });
  dados.postos.forEach((p) => {
    const el = elemento({ ...PINO, width: "18px", height: "18px", fontSize: "10px", background: "#7dd3e8" }, "P");
    el.title = p.nome;
    marcadores.push(new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(mapa));
  });
  dados.pontos.forEach((p, i) => {
    const el = elemento({ ...PINO, background: COR_TRACO }, rotuloPonto(i, dados.pontos.length));
    el.title = p.nome || p.endereco;
    marcadores.push(new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(mapa));
  });

  let voce: maplibregl.Marker | null = null;

  return {
    atualizarPosicao: (posicao) => {
      if (!posicao) {
        voce?.remove();
        voce = null;
        return;
      }
      if (!voce) {
        const el = elemento({
          width: "16px",
          height: "16px",
          borderRadius: "9999px",
          background: "#4fc3f7",
          border: "3px solid #ffffff",
          boxShadow: "0 0 0 6px rgba(79, 195, 247, 0.3)",
        });
        el.setAttribute("aria-label", "Você");
        voce = new maplibregl.Marker({ element: el }).setLngLat([posicao.lng, posicao.lat]).addTo(mapa);
        return;
      }
      voce.setLngLat([posicao.lng, posicao.lat]);
    },
    destruir: () => {
      marcadores.forEach((m) => m.remove());
      voce?.remove();
      mapa.remove();
    },
  };
};
