"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./mapa-selecao-local.module.css";

const CENTRO_BRASIL: [number, number] = [-14.235, -51.9253];
const ZOOM_PAIS = 4;
const ZOOM_LOCAL = 16;

export type PropsMapaSelecaoLocal = {
  lat: number | null;
  lng: number | null;
  /** Incrementa só em busca/GPS — dispara flyTo sem brigar com arraste do pin. */
  vooId: number;
  onMoverPonto: (lat: number, lng: number) => void;
  desabilitado?: boolean;
  className?: string;
  hintVazio?: string;
  hintAjuste?: string;
};

type MoverPonto = (lat: number, lng: number) => void;

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
}: {
  lat: number;
  lng: number;
  vooId: number;
}) => {
  const map = useMap();
  const ultimaChave = useRef<number | null>(null);

  useEffect(() => {
    if (ultimaChave.current === vooId) return;
    ultimaChave.current = vooId;
    map.flyTo([lat, lng], ZOOM_LOCAL, { duration: 0.7 });
  }, [lat, lng, vooId, map]);

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

const MarcadorArrastavel = ({
  lat,
  lng,
  desabilitado,
  desabilitadoRef,
  onMoverPontoRef,
}: {
  lat: number;
  lng: number;
  desabilitado?: boolean;
  desabilitadoRef: MutableRefObject<boolean>;
  onMoverPontoRef: MutableRefObject<MoverPonto>;
}) => {
  const icone = useMemo(() => criarIconePin(), []);
  const eventHandlers = useMemo(
    () => ({
      dragend: (e: L.LeafletEvent) => {
        if (desabilitadoRef.current) return;
        const mover = onMoverPontoRef.current;
        if (typeof mover !== "function") return;
        const pos = (e.target as L.Marker).getLatLng();
        mover(pos.lat, pos.lng);
      },
    }),
    [desabilitadoRef, onMoverPontoRef],
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
}: PropsMapaSelecaoLocal) => {
  const temPonto = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const centro: [number, number] = temPonto ? [lat, lng] : CENTRO_BRASIL;
  const zoomInicial = temPonto ? ZOOM_LOCAL : ZOOM_PAIS;
  const onMoverPontoRef = useRef<MoverPonto>(onMoverPonto);
  const desabilitadoRef = useRef(Boolean(desabilitado));
  onMoverPontoRef.current = onMoverPonto;
  desabilitadoRef.current = Boolean(desabilitado);

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
        <CliqueNoMapa
          desabilitadoRef={desabilitadoRef}
          onMoverPontoRef={onMoverPontoRef}
        />
        {temPonto ? (
          <>
            <VooParaPonto lat={lat} lng={lng} vooId={vooId} />
            <MarcadorArrastavel
              lat={lat}
              lng={lng}
              desabilitado={desabilitado}
              desabilitadoRef={desabilitadoRef}
              onMoverPontoRef={onMoverPontoRef}
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
