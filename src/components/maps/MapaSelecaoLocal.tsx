"use client";

import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CENTRO_SUL_DEFAULT,
  pontoEstaNoSul,
  ZOOM_SUL_GPS,
  ZOOM_SUL_REGIAO,
} from "@/lib/regiao-sul";
import { COR_CIRCULO, zoomDoPonto } from "./raio-mapa";
import styles from "./mapa-selecao-local.module.css";

export type PropsMapaSelecaoLocal = {
  lat: number | null;
  lng: number | null;
  /** Incrementa só em busca/GPS — dispara flyTo sem brigar com arraste do pin. */
  vooId: number;
  onMoverPonto: (lat: number, lng: number) => boolean | void;
  desabilitado?: boolean;
  className?: string;
  hintVazio?: string;
  hintAjuste?: string;
  /** Desenha o círculo em metros ao redor do pino (conquistas). */
  raioMetros?: number;
};

const OPCOES_CIRCULO = {
  color: COR_CIRCULO,
  weight: 2,
  fillColor: COR_CIRCULO,
  fillOpacity: 0.15,
};

type MoverPonto = (lat: number, lng: number) => boolean | void;

const criarIconePin = () =>
  L.divIcon({
    className: styles.pin,
    html: `<svg class="${styles.pinSvg}" viewBox="0 0 28 40" aria-hidden="true">
      <path fill="#ff4500" stroke="#fff" stroke-width="1.5"
        d="M14 1.5c-6.1 0-11 4.9-11 11 0 8.3 11 25 11 25s11-16.7 11-25c0-6.1-4.9-11-11-11z"/>
      <circle cx="14" cy="12.5" r="4.2" fill="#fff"/>
    </svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
  });

const VooParaPonto = ({
  lat,
  lng,
  vooId,
  zoom,
}: {
  lat: number;
  lng: number;
  vooId: number;
  zoom: number;
}) => {
  const map = useMap();
  const ultimaChave = useRef<number | null>(null);

  useEffect(() => {
    if (ultimaChave.current === vooId) return;
    ultimaChave.current = vooId;
    map.flyTo([lat, lng], zoom, { duration: 0.7 });
  }, [lat, lng, vooId, zoom, map]);

  return null;
};

const CliqueNoMapa = ({
  desabilitadoRef,
  onMoverPontoRef,
}: {
  desabilitadoRef: MutableRefObject<boolean>;
  onMoverPontoRef: MutableRefObject<MoverPonto>;
}) => {
  useMapEvents({
    click(e) {
      if (desabilitadoRef.current) return;
      onMoverPontoRef.current(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const AjustarTamanho = () => {
  const map = useMap();
  useEffect(() => {
    const ajustar = () => map.invalidateSize();
    const id = window.setTimeout(ajustar, 80);
    window.addEventListener("resize", ajustar);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", ajustar);
    };
  }, [map]);
  return null;
};

const CentrarGpsSul = ({ ativo }: { ativo: boolean }) => {
  const map = useMap();
  const tentou = useRef(false);

  useEffect(() => {
    if (!ativo || tentou.current || !navigator.geolocation) return;
    tentou.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (pontoEstaNoSul(latitude, longitude)) {
          map.setView([latitude, longitude], ZOOM_SUL_GPS);
        }
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }, [ativo, map]);

  return null;
};

const MarcadorArrastavel = ({
  lat,
  lng,
  desabilitado,
  desabilitadoRef,
  onMoverPontoRef,
  onArrastando,
}: {
  lat: number;
  lng: number;
  desabilitado?: boolean;
  desabilitadoRef: MutableRefObject<boolean>;
  onMoverPontoRef: MutableRefObject<MoverPonto>;
  onArrastando?: (lat: number, lng: number) => void;
}) => {
  const icone = useMemo(() => criarIconePin(), []);
  const eventHandlers = useMemo(
    () => ({
      drag: (e: L.LeafletEvent) => {
        const pos = (e.target as L.Marker).getLatLng();
        onArrastando?.(pos.lat, pos.lng);
      },
      dragend: (e: L.LeafletEvent) => {
        if (desabilitadoRef.current) return;
        const mover = onMoverPontoRef.current;
        if (typeof mover !== "function") return;
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        const aceito = mover(pos.lat, pos.lng);
        if (aceito === false) {
          marker.setLatLng([lat, lng]);
          onArrastando?.(lat, lng);
        }
      },
    }),
    [desabilitadoRef, onMoverPontoRef, onArrastando, lat, lng],
  );

  return (
    <Marker
      position={[lat, lng]}
      draggable={!desabilitado}
      icon={icone}
      eventHandlers={eventHandlers}
    />
  );
};

export const MapaSelecaoLocal = ({
  lat,
  lng,
  vooId,
  onMoverPonto,
  desabilitado,
  className,
  hintVazio = "Toque no mapa ou busque o endereço",
  hintAjuste = "Arraste o alfinete para ajustar o ponto",
  raioMetros,
}: PropsMapaSelecaoLocal) => {
  const temPonto = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const centro: [number, number] = temPonto ? [lat, lng] : CENTRO_SUL_DEFAULT;
  const zoomPonto = zoomDoPonto(raioMetros);
  const zoomInicial = temPonto ? zoomPonto : ZOOM_SUL_REGIAO;
  const onMoverPontoRef = useRef<MoverPonto>(onMoverPonto);
  const desabilitadoRef = useRef(Boolean(desabilitado));
  onMoverPontoRef.current = onMoverPonto;
  desabilitadoRef.current = Boolean(desabilitado);
  const circuloRef = useRef<L.Circle | null>(null);
  const moverCirculo = useCallback((novaLat: number, novaLng: number) => {
    circuloRef.current?.setLatLng([novaLat, novaLng]);
  }, []);

  return (
    <div className={[styles.mapa, className].filter(Boolean).join(" ")}>
      <MapContainer
        center={centro}
        zoom={zoomInicial}
        scrollWheelZoom
        dragging={!desabilitado}
        doubleClickZoom={!desabilitado}
        touchZoom={!desabilitado}
        zoomControl
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AjustarTamanho />
        <CentrarGpsSul ativo={!temPonto} />
        <CliqueNoMapa
          desabilitadoRef={desabilitadoRef}
          onMoverPontoRef={onMoverPontoRef}
        />
        {temPonto ? (
          <>
            <VooParaPonto lat={lat} lng={lng} vooId={vooId} zoom={zoomPonto} />
            {raioMetros ? (
              <Circle
                ref={circuloRef}
                center={[lat, lng]}
                radius={raioMetros}
                pathOptions={OPCOES_CIRCULO}
                interactive={false}
              />
            ) : null}
            <MarcadorArrastavel
              lat={lat}
              lng={lng}
              desabilitado={desabilitado}
              desabilitadoRef={desabilitadoRef}
              onMoverPontoRef={onMoverPontoRef}
              onArrastando={raioMetros ? moverCirculo : undefined}
            />
          </>
        ) : null}
      </MapContainer>
      <div className={styles.hint} role="status">
        <span className={`material-symbols-outlined ${styles.hintIcone}`} aria-hidden>
          {temPonto ? "open_with" : "touch_app"}
        </span>
        {temPonto ? hintAjuste : hintVazio}
      </div>
    </div>
  );
};
