"use client";

import { useEffect, useRef, useState } from "react";
import {
  carregarGoogleMaps,
  chaveGoogleMaps,
  ESTILO_MAPA_ESCURO,
  iconePin,
  observarFalhaAuthGoogle,
  type GoogleMap,
  type GoogleMapsNs,
  type GoogleMarker,
  type LatLng,
  type ListenerMapa,
} from "@/lib/google-maps";
import {
  CENTRO_SUL_DEFAULT,
  pontoEstaNoSul,
  ZOOM_SUL_GPS,
  ZOOM_SUL_REGIAO,
} from "@/lib/regiao-sul";

const ZOOM_LOCAL = 16;

type MoverPonto = (lat: number, lng: number) => boolean | void;

type Args = {
  lat: number | null;
  lng: number | null;
  vooId: number;
  onMoverPonto: MoverPonto;
  desabilitado?: boolean;
};

const pontoValido = (lat: number | null, lng: number | null): lat is number =>
  lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

const opcoesGestos = (travado: boolean) => ({
  gestureHandling: travado ? "none" : "greedy",
  draggable: !travado,
  scrollwheel: !travado,
  disableDoubleClickZoom: travado,
  zoomControl: !travado,
  keyboardShortcuts: !travado,
});

export const useMapaSelecaoGoogle = ({
  lat,
  lng,
  vooId,
  onMoverPonto,
  desabilitado,
}: Args) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const mapsRef = useRef<GoogleMapsNs | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const listenersRef = useRef<ListenerMapa[]>([]);
  const latRef = useRef(lat);
  const lngRef = useRef(lng);
  const moverRef = useRef(onMoverPonto);
  const travadoRef = useRef(Boolean(desabilitado));
  const vooAplicado = useRef<number | null>(null);
  const [pronto, setPronto] = useState(false);
  const [falhou, setFalhou] = useState(false);

  latRef.current = lat;
  lngRef.current = lng;
  moverRef.current = onMoverPonto;
  travadoRef.current = Boolean(desabilitado);

  useEffect(() => {
    const el = containerRef.current;
    const chave = chaveGoogleMaps();
    if (!el || !chave) return;

    let cancelado = false;
    const ouvintes: ListenerMapa[] = [];
    const pararAuth = observarFalhaAuthGoogle(() => {
      if (!cancelado) setFalhou(true);
    });

    void carregarGoogleMaps(chave)
      .then((maps) => {
        if (cancelado) return;
        mapsRef.current = maps;
        const temPonto = pontoValido(latRef.current, lngRef.current);
        const centro: LatLng = temPonto
          ? { lat: latRef.current as number, lng: lngRef.current as number }
          : { lat: CENTRO_SUL_DEFAULT[0], lng: CENTRO_SUL_DEFAULT[1] };

        const map = new maps.Map(el, {
          center: centro,
          zoom: temPonto ? ZOOM_LOCAL : ZOOM_SUL_REGIAO,
          styles: ESTILO_MAPA_ESCURO,
          backgroundColor: "#1a1c20",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          ...opcoesGestos(travadoRef.current),
        });
        mapRef.current = map;

        ouvintes.push(
          maps.event.addListener(map, "click", (evento) => {
            if (travadoRef.current || !evento?.latLng) return;
            moverRef.current(evento.latLng.lat(), evento.latLng.lng());
          }),
        );
        listenersRef.current = ouvintes;

        const observar = new ResizeObserver(() => {
          maps.event.trigger(map, "resize");
        });
        observar.observe(el);
        ouvintes.push({ remove: () => observar.disconnect() });

        if (!temPonto && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelado || pontoValido(latRef.current, lngRef.current)) return;
              const { latitude, longitude } = pos.coords;
              if (!pontoEstaNoSul(latitude, longitude)) return;
              map.setCenter({ lat: latitude, lng: longitude });
              map.setZoom(ZOOM_SUL_GPS);
            },
            () => undefined,
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
          );
        }

        setPronto(true);
      })
      .catch(() => {
        if (!cancelado) setFalhou(true);
      });

    return () => {
      cancelado = true;
      pararAuth();
      ouvintes.forEach((ouvinte) => ouvinte.remove());
      listenersRef.current = [];
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapRef.current?.setOptions(opcoesGestos(Boolean(desabilitado)));
    markerRef.current?.setDraggable(!desabilitado);
  }, [desabilitado, pronto]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps || !pronto) return;

    if (!pontoValido(lat, lng) || lng == null) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      return;
    }

    const posicao = { lat, lng };
    let marker = markerRef.current;
    if (!marker) {
      marker = new maps.Marker({
        map,
        position: posicao,
        draggable: !travadoRef.current,
        icon: iconePin(maps),
      });
      markerRef.current = marker;
      const criado = marker;
      listenersRef.current.push(
        maps.event.addListener(criado, "dragend", () => {
          if (travadoRef.current) return;
          const pos = criado.getPosition();
          if (!pos) return;
          const aceito = moverRef.current(pos.lat(), pos.lng());
          if (
            aceito === false &&
            pontoValido(latRef.current, lngRef.current)
          ) {
            criado.setPosition({
              lat: latRef.current as number,
              lng: lngRef.current as number,
            });
          }
        }),
      );
      return;
    }

    marker.setPosition(posicao);
    marker.setDraggable(!desabilitado);
  }, [pronto, lat, lng, desabilitado]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pronto) return;
    if (vooAplicado.current === vooId) return;
    vooAplicado.current = vooId;
    if (!pontoValido(lat, lng) || lng == null) return;
    map.panTo({ lat, lng });
    map.setZoom(ZOOM_LOCAL);
  }, [pronto, vooId, lat, lng]);

  return { containerRef, pronto, falhou };
};
