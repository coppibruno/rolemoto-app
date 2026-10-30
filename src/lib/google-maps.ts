/**
 * Maps JavaScript API no mapa de seleção da criação.
 * O script entra uma vez e os dois mapas do rolê compartilham a tag.
 */

const SCRIPT_ID = "rolemoto-google-maps";
const CALLBACK = "__rolemotoInitGoogleMaps";

export type LatLng = { lat: number; lng: number };

export type ListenerMapa = { remove: () => void };

export type GoogleMap = {
  panTo: (pos: LatLng) => void;
  setZoom: (zoom: number) => void;
  setCenter: (pos: LatLng) => void;
  setOptions: (opts: Record<string, unknown>) => void;
};

export type GoogleMarker = {
  setPosition: (pos: LatLng) => void;
  setDraggable: (valor: boolean) => void;
  setMap: (map: GoogleMap | null) => void;
  getPosition: () => { lat: () => number; lng: () => number } | null | undefined;
};

type EventoMouse = {
  latLng?: { lat: () => number; lng: () => number } | null;
};

export type GoogleMapsNs = {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GoogleMap;
  Marker: new (opts: Record<string, unknown>) => GoogleMarker;
  Size: new (w: number, h: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  event: {
    addListener: (
      alvo: object,
      evento: string,
      handler: (e?: EventoMouse) => void,
    ) => ListenerMapa;
    trigger: (alvo: object, evento: string) => void;
  };
};

type JanelaMapa = Window & {
  google?: { maps?: GoogleMapsNs };
  gm_authFailure?: () => void;
  [CALLBACK]?: () => void;
};

/** JSON escuro, sem Map ID, para acompanhar o cockpit. */
export const ESTILO_MAPA_ESCURO: Record<string, unknown>[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1c20" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9a9aa3" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1c20" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#3a3d44" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2a2d33" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c4c4cc" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3a3d44" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1014" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6a6a72" }],
  },
];

const SVG_PIN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 40">
  <path fill="#ff4500" stroke="#fff" stroke-width="1.5"
    d="M14 1.5c-6.1 0-11 4.9-11 11 0 8.3 11 25 11 25s11-16.7 11-25c0-6.1-4.9-11-11-11z"/>
  <circle cx="14" cy="12.5" r="4.2" fill="#fff"/>
</svg>`;

// Acesso direto: o Next só grava NEXT_PUBLIC_* no JS de produção assim.
// Com `?.` a chave existe no `next dev` e some no build da Vercel.
const CHAVE_GOOGLE_MAPS = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const chaveGoogleMaps = (): string => CHAVE_GOOGLE_MAPS?.trim() ?? "";

const lerNamespace = (): GoogleMapsNs | null => {
  const maps = (window as JanelaMapa).google?.maps;
  if (!maps?.Map || !maps.Marker || !maps.event) return null;
  return maps;
};

const falhasAuth: Array<() => void> = [];

/** A Maps JavaScript API chama `gm_authFailure` quando a chave é recusada. */
export const observarFalhaAuthGoogle = (ouvir: () => void): (() => void) => {
  falhasAuth.push(ouvir);
  return () => {
    const indice = falhasAuth.indexOf(ouvir);
    if (indice >= 0) falhasAuth.splice(indice, 1);
  };
};

let pendente: Promise<GoogleMapsNs> | null = null;

export const carregarGoogleMaps = (chave: string): Promise<GoogleMapsNs> => {
  const pronto = lerNamespace();
  if (pronto) return Promise.resolve(pronto);
  if (pendente) return pendente;

  pendente = new Promise((resolve, reject) => {
    const janela = window as JanelaMapa;
    janela.gm_authFailure = () => {
      falhasAuth.forEach((ouvir) => ouvir());
    };
    janela[CALLBACK] = () => {
      delete janela[CALLBACK];
      const maps = lerNamespace();
      if (maps) resolve(maps);
      else {
        pendente = null;
        reject(new Error("Google Maps indisponível"));
      }
    };

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src =
      "https://maps.googleapis.com/maps/api/js" +
      `?key=${encodeURIComponent(chave)}&v=weekly&callback=${CALLBACK}`;
    script.onerror = () => {
      pendente = null;
      delete janela[CALLBACK];
      reject(new Error("Falha ao carregar o Google Maps"));
    };
    document.head.appendChild(script);
  });

  return pendente;
};

export const iconePin = (maps: GoogleMapsNs) => ({
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(SVG_PIN)}`,
  scaledSize: new maps.Size(28, 40),
  anchor: new maps.Point(14, 40),
});
