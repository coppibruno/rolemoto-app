import { urlRotaMaps } from "@/lib/maps";
import { formatarDistancia, labelPontoTelemetria } from "@/lib/telemetria/formatar-telemetria";
import type { PontoTelemetria } from "@/types/role-telemetria";
import styles from "./telemetria.module.css";

type Props = {
  pontoInicio: PontoTelemetria;
  pontoFim: PontoTelemetria;
  distanciaKm: number;
};

const urlMapaEstatico = (a: PontoTelemetria, b: PontoTelemetria): string => {
  const lat = (a.lat + b.lat) / 2;
  const lng = (a.lng + b.lng) / 2;
  return (
    `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}` +
    `&zoom=12&size=560x200&maptype=mapnik` +
    `&markers=${a.lat},${a.lng},lightblue1|${b.lat},${b.lng},orangered`
  );
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
        <img
          src={urlMapaEstatico(pontoInicio, pontoFim)}
          alt="Mapa com partida e destino"
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
