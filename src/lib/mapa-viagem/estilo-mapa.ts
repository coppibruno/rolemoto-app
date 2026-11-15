import type { StyleSpecification } from "maplibre-gl";

/**
 * Estilo escuro para o esquema de camadas do basemap Protomaps (earth, water, roads…).
 * Sem glyphs nem sprites: nomes de cidade e postos entram como marcadores HTML,
 * então nada pede rede depois do download.
 */
export const COR_TRACO = "#ff6b00";

export const estiloMapaViagem = (urlFonte: string): StyleSpecification => ({
  version: 8,
  sources: {
    base: { type: "vector", url: urlFonte, attribution: "© OpenStreetMap" },
  },
  layers: [
    { id: "fundo", type: "background", paint: { "background-color": "#121316" } },
    {
      id: "terra",
      type: "fill",
      source: "base",
      "source-layer": "earth",
      paint: { "fill-color": "#1a1c20" },
    },
    {
      id: "vegetacao",
      type: "fill",
      source: "base",
      "source-layer": "landcover",
      paint: { "fill-color": "#18201b", "fill-opacity": 0.7 },
    },
    {
      id: "uso-solo",
      type: "fill",
      source: "base",
      "source-layer": "landuse",
      paint: { "fill-color": "#1e2126", "fill-opacity": 0.6 },
    },
    {
      id: "agua",
      type: "fill",
      source: "base",
      "source-layer": "water",
      paint: { "fill-color": "#0e2433" },
    },
    {
      id: "limites",
      type: "line",
      source: "base",
      "source-layer": "boundaries",
      paint: { "line-color": "#4a4d55", "line-width": 1, "line-dasharray": [3, 2] },
    },
    {
      id: "vias-locais",
      type: "line",
      source: "base",
      "source-layer": "roads",
      minzoom: 12,
      filter: ["in", ["get", "kind"], ["literal", ["minor_road", "other"]]],
      paint: { "line-color": "#2b2e34", "line-width": 1 },
    },
    {
      id: "vias-medias",
      type: "line",
      source: "base",
      "source-layer": "roads",
      filter: ["==", ["get", "kind"], "medium_road"],
      paint: { "line-color": "#3a3d44", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.6, 14, 2] },
    },
    {
      id: "vias-principais",
      type: "line",
      source: "base",
      "source-layer": "roads",
      filter: ["==", ["get", "kind"], "major_road"],
      paint: { "line-color": "#565961", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.8, 14, 3] },
    },
    {
      id: "rodovias",
      type: "line",
      source: "base",
      "source-layer": "roads",
      filter: ["==", ["get", "kind"], "highway"],
      paint: { "line-color": "#8a5a32", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.2, 14, 4] },
    },
  ],
});
