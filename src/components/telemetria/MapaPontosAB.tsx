"use client";

import { useMemo, useState } from "react";
import { MapaLeitura } from "@/components/maps/MapaLeitura";
import type { MarcadorMapa } from "@/components/maps/MapaEstatico";
import { medalhaEmDestaque } from "@/lib/conquistas";
import type { PontoLatLng } from "@/lib/mapa-tiles";
import { urlRotaMaps } from "@/lib/maps";
import {
  escalaVelocidadeTracado,
  indiceVelocidadeMaxima,
} from "@/lib/telemetria/escala-velocidade-tracado";
import {
  formatarDistancia,
  formatarVelocidade,
  labelPontoTelemetria,
} from "@/lib/telemetria/formatar-telemetria";
import {
  decodificarPolyline,
  decodificarVelocidades,
  indiceVerticeMaisProximo,
} from "@/lib/telemetria/tracado";
import type { MedalhaTelemetria } from "@/types/conquista";
import type { PontoTelemetria } from "@/types/role-telemetria";
import styles from "./telemetria.module.css";

type Props = {
  pontoInicio: PontoTelemetria;
  pontoFim: PontoTelemetria;
  distanciaKm: number;
  tracado?: string;
  tracadoVelocidades?: string;
  medalhas?: MedalhaTelemetria[];
  onTocarMedalha?: (indice: number) => void;
};

const SEM_MEDALHAS: MedalhaTelemetria[] = [];

const corMedalha = (medalha: MedalhaTelemetria): string =>
  medalhaEmDestaque(medalha.novidade) ? "var(--primary-container)" : "var(--outline)";

const formatarAncoraLegenda = (kmh: number): string =>
  Math.round(kmh).toLocaleString("pt-BR");

export const MapaPontosAB = ({
  pontoInicio,
  pontoFim,
  distanciaKm,
  tracado,
  tracadoVelocidades,
  medalhas = SEM_MEDALHAS,
  onTocarMedalha,
}: Props) => {
  const trajeto = useMemo(() => decodificarPolyline(tracado ?? ""), [tracado]);
  const velocidades = useMemo(
    () => decodificarVelocidades(tracadoVelocidades ?? ""),
    [tracadoVelocidades],
  );
  const inspecionavel =
    trajeto.length >= 2 && velocidades.length === trajeto.length;
  const escala = useMemo(
    () => (inspecionavel ? escalaVelocidadeTracado(velocidades) : null),
    [inspecionavel, velocidades],
  );
  const indiceMax = useMemo(
    () => (inspecionavel ? indiceVelocidadeMaxima(velocidades) : -1),
    [inspecionavel, velocidades],
  );
  const [inspecao, setInspecao] = useState<{
    indice: number;
    velocidadeKmh: number;
  } | null>(null);

  const abrirInspecao = (indice: number) => {
    if (indice < 0) return;
    setInspecao((atual) => {
      if (atual?.indice === indice) return null;
      const kmh = velocidades[indice];
      if (kmh == null) return atual;
      return { indice, velocidadeKmh: kmh };
    });
  };

  const marcadores = useMemo<MarcadorMapa[]>(() => {
    const base: MarcadorMapa[] = [
      {
        lat: pontoInicio.lat,
        lng: pontoInicio.lng,
        cor: "#38bdf8",
        rotulo: "A",
      },
      {
        lat: pontoFim.lat,
        lng: pontoFim.lng,
        cor: "#f97316",
        rotulo: "B",
      },
      ...medalhas.map((medalha, indice) => ({
        lat: medalha.lat,
        lng: medalha.lng,
        cor: corMedalha(medalha),
        icone: "military_tech",
        nomeAcessivel: `Medalha ${medalha.nome}`,
        onToque: onTocarMedalha ? () => onTocarMedalha(indice) : undefined,
      })),
    ];
    if (indiceMax >= 0 && trajeto[indiceMax]) {
      const kmh = velocidades[indiceMax];
      base.push({
        lat: trajeto[indiceMax].lat,
        lng: trajeto[indiceMax].lng,
        cor: "var(--primary-container)",
        icone: "speed",
        nomeAcessivel: `Velocidade máxima no traçado ${formatarVelocidade(kmh)}`,
        zIndex: 20,
        onToque: () => abrirInspecao(indiceMax),
      });
    }
    if (
      inspecao &&
      trajeto[inspecao.indice] &&
      inspecao.indice !== indiceMax
    ) {
      base.push({
        lat: trajeto[inspecao.indice].lat,
        lng: trajeto[inspecao.indice].lng,
        cor: "#00daf3",
        nomeAcessivel: `Velocidade ${formatarVelocidade(inspecao.velocidadeKmh)}`,
        efemero: true,
      });
    }
    return base;
  }, [
    indiceMax,
    inspecao,
    medalhas,
    onTocarMedalha,
    pontoFim.lat,
    pontoFim.lng,
    pontoInicio.lat,
    pontoInicio.lng,
    trajeto,
    velocidades,
  ]);

  const hrefMaps = urlRotaMaps(
    {
      lat: pontoInicio.lat,
      lng: pontoInicio.lng,
      endereco: pontoInicio.endereco,
      nome: pontoInicio.nome,
    },
    {
      lat: pontoFim.lat,
      lng: pontoFim.lng,
      endereco: pontoFim.endereco,
      nome: pontoFim.nome,
    },
  );

  const aoTocarTrajeto = inspecionavel
    ? (ponto: PontoLatLng) => {
        abrirInspecao(indiceVerticeMaisProximo(trajeto, ponto));
      }
    : undefined;

  return (
    <div className={styles.mapa}>
      <div className={styles.mapaTopo}>
        <span className={styles.mapaLabel}>
          <span className={styles.ping} aria-hidden />
          {inspecionavel
            ? `Toque para ver km/h · ${formatarDistancia(distanciaKm)}`
            : `Traçado GPS · ${formatarDistancia(distanciaKm)}`}
        </span>
        <a
          href={hrefMaps}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkMaps}
        >
          <span className="material-symbols-outlined">map</span>
          Google Maps
        </a>
      </div>
      <div className={styles.mapaCanvas}>
        <MapaLeitura
          marcadores={marcadores}
          ligarMarcadores
          trajeto={trajeto}
          trajetoCores={escala?.coresSegmentos}
          onTocarTrajeto={aoTocarTrajeto}
          aria-label={
            trajeto.length >= 2
              ? inspecionavel
                ? escala
                  ? "Mapa com o caminho colorido por velocidade; toque para ver o km/h do ponto"
                  : "Mapa com o caminho percorrido; toque para ver a velocidade"
                : "Mapa com o caminho percorrido"
              : "Mapa com partida e destino"
          }
          className={styles.mapaImg}
        />
        {escala ? (
          <div
            className={styles.legendaVelocidade}
            aria-label={`Legenda de velocidade: de ${formatarVelocidade(escala.minKmh)} a ${formatarVelocidade(escala.maxKmh)}`}
          >
            <span className={styles.legendaAncora}>
              {formatarAncoraLegenda(escala.minKmh)}
            </span>
            <span className={styles.legendaFaixa} aria-hidden />
            <span className={styles.legendaAncora}>
              {formatarAncoraLegenda(escala.maxKmh)} km/h
            </span>
          </div>
        ) : null}
        {inspecao ? (
          <button
            type="button"
            className={styles.chipVelocidade}
            onClick={() => setInspecao(null)}
            aria-label={`Velocidade ${formatarVelocidade(inspecao.velocidadeKmh)}. Toque para fechar.`}
          >
            <span className="material-symbols-outlined" aria-hidden>
              speed
            </span>
            {formatarVelocidade(inspecao.velocidadeKmh)}
          </button>
        ) : null}
      </div>
      {medalhas.length > 0 ? (
        <ul className={styles.faixaMedalhas} aria-label="Medalhas deste passeio">
          {medalhas.map((medalha, indice) => (
            <li key={`${medalha.conquistaId}-${indice}`}>
              <button
                type="button"
                className={styles.botaoMedalha}
                onClick={onTocarMedalha ? () => onTocarMedalha(indice) : undefined}
                disabled={!onTocarMedalha}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: corMedalha(medalha) }}
                  aria-hidden
                >
                  military_tech
                </span>
                <span className={styles.botaoMedalhaNome}>{medalha.nome}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className={styles.pontosAb}>
        <div className={styles.pontoCard}>
          <span className={`material-symbols-outlined ${styles.pontoA}`}>
            trip_origin
          </span>
          <div>
            <span className={`${styles.pontoRotulo} ${styles.pontoA}`}>
              Partida (A)
            </span>
            <span className={styles.pontoNome}>
              {labelPontoTelemetria(pontoInicio)}
            </span>
            {pontoInicio.endereco && pontoInicio.endereco !== pontoInicio.nome ? (
              <span className={styles.pontoEndereco}>{pontoInicio.endereco}</span>
            ) : null}
          </div>
        </div>
        <div className={styles.pontoCard}>
          <span className={`material-symbols-outlined ${styles.pontoB}`}>
            sports_score
          </span>
          <div>
            <span className={`${styles.pontoRotulo} ${styles.pontoB}`}>
              Destino (B)
            </span>
            <span className={styles.pontoNome}>
              {labelPontoTelemetria(pontoFim)}
            </span>
            {pontoFim.endereco && pontoFim.endereco !== pontoFim.nome ? (
              <span className={styles.pontoEndereco}>{pontoFim.endereco}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
