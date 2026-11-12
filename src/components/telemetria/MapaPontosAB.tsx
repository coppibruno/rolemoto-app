import { useMemo } from "react";
import { MapaLeitura } from "@/components/maps/MapaLeitura";
import type { MarcadorMapa } from "@/components/maps/MapaEstatico";
import { medalhaEmDestaque } from "@/lib/conquistas";
import { urlRotaMaps } from "@/lib/maps";
import { formatarDistancia, labelPontoTelemetria } from "@/lib/telemetria/formatar-telemetria";
import { decodificarPolyline } from "@/lib/telemetria/tracado";
import type { MedalhaTelemetria } from "@/types/conquista";
import type { PontoTelemetria } from "@/types/role-telemetria";
import styles from "./telemetria.module.css";

type Props = {
  pontoInicio: PontoTelemetria;
  pontoFim: PontoTelemetria;
  distanciaKm: number;
  tracado?: string;
  medalhas?: MedalhaTelemetria[];
  onTocarMedalha?: (indice: number) => void;
};

const SEM_MEDALHAS: MedalhaTelemetria[] = [];

const corMedalha = (medalha: MedalhaTelemetria): string =>
  medalhaEmDestaque(medalha.novidade) ? "var(--primary-container)" : "var(--outline)";

export const MapaPontosAB = ({
  pontoInicio,
  pontoFim,
  distanciaKm,
  tracado,
  medalhas = SEM_MEDALHAS,
  onTocarMedalha,
}: Props) => {
  const trajeto = useMemo(() => decodificarPolyline(tracado ?? ""), [tracado]);
  const marcadores = useMemo<MarcadorMapa[]>(
    () => [
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
    ],
    [medalhas, onTocarMedalha, pontoFim.lat, pontoFim.lng, pontoInicio.lat, pontoInicio.lng],
  );
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

  return (
    <div className={styles.mapa}>
      <div className={styles.mapaTopo}>
        <span className={styles.mapaLabel}>
          <span className={styles.ping} aria-hidden />
          Traçado GPS · {formatarDistancia(distanciaKm)}
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
          aria-label={
            trajeto.length >= 2
              ? "Mapa com o caminho percorrido"
              : "Mapa com partida e destino"
          }
          className={styles.mapaImg}
        />
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
