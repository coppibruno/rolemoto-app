"use client";

import { useEffect, useRef, useState } from "react";
import {
  carregarGoogleMaps,
  chaveGoogleMaps,
  ESTILO_MAPA_SELECAO,
  observarFalhaAuthGoogle,
  type GoogleCircle,
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
import { COR_CIRCULO, zoomDoPonto } from "./raio-mapa";

type MoverPonto = (lat: number, lng: number) => boolean | void;

type Args = {
  lat: number | null;
  lng: number | null;
  vooId: number;
  onMoverPonto: MoverPonto;
  desabilitado?: boolean;
  raioMetros?: number;
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
  raioMetros,
}: Args) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const mapsRef = useRef<GoogleMapsNs | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const circleRef = useRef<GoogleCircle | null>(null);
  const raioRef = useRef(raioMetros);
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
  raioRef.current = raioMetros;

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
          zoom: temPonto ? zoomDoPonto(raioRef.current) : ZOOM_SUL_REGIAO,
          styles: ESTILO_MAPA_SELECAO,
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
      circleRef.current?.setMap(null);
      circleRef.current = null;
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
      });
      markerRef.current = marker;
      const criado = marker;
      listenersRef.current.push(
        maps.event.addListener(criado, "drag", () => {
          const pos = criado.getPosition();
          if (pos) circleRef.current?.setCenter({ lat: pos.lat(), lng: pos.lng() });
        }),
        maps.event.addListener(criado, "dragend", () => {
          if (travadoRef.current) return;
          const pos = criado.getPosition();
          if (!pos) return;
          const aceito = moverRef.current(pos.lat(), pos.lng());
          if (
            aceito === false &&
            pontoValido(latRef.current, lngRef.current)
          ) {
            const anterior = {
              lat: latRef.current as number,
              lng: lngRef.current as number,
            };
            criado.setPosition(anterior);
            circleRef.current?.setCenter(anterior);
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
    map.setZoom(zoomDoPonto(raioRef.current));
  }, [pronto, vooId, lat, lng]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps?.Circle || !pronto) return;
    if (!raioMetros || !pontoValido(lat, lng) || lng == null) {
      circleRef.current?.setMap(null);
      circleRef.current = null;
      return;
    }
    const centro = { lat, lng };
    if (!circleRef.current) {
      circleRef.current = new maps.Circle({
        map,
        center: centro,
        radius: raioMetros,
        strokeColor: COR_CIRCULO,
        strokeWeight: 2,
        fillColor: COR_CIRCULO,
        fillOpacity: 0.15,
        clickable: false,
      });
      return;
    }
    circleRef.current.setCenter(centro);
    circleRef.current.setRadius(raioMetros);
  }, [pronto, lat, lng, raioMetros]);

  return { containerRef, pronto, falhou };
};
