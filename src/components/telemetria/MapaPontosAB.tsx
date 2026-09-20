import { MapaEstatico } from "@/components/maps/MapaEstatico";
import { urlRotaMaps } from "@/lib/maps";
import { formatarDistancia, labelPontoTelemetria } from "@/lib/telemetria/formatar-telemetria";
import type { PontoTelemetria } from "@/types/role-telemetria";
import styles from "./telemetria.module.css";

type Props = {
  pontoInicio: PontoTelemetria;
  pontoFim: PontoTelemetria;
  distanciaKm: number;
};

export const MapaPontosAB = ({ pontoInicio, pontoFim, distanciaKm }: Props) => {
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
        <MapaEstatico
          marcadores={[
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
          ]}
          ligarMarcadores
          aria-label="Mapa com partida e destino"
          className={styles.mapaImg}
        />
      </div>
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
