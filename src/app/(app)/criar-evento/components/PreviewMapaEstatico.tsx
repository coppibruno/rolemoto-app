import { BADGE_PONTO, HINT_MAPA_VAZIO } from "../constants";
import styles from "../criar-evento.module.css";

type Props = {
  lat: number | null;
  lng: number | null;
};

const urlMapaEstatico = (lat: number, lng: number): string =>
  `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=16&size=560x224&maptype=mapnik&markers=${lat},${lng},orangered`;

export const PreviewMapaEstatico = ({ lat, lng }: Props) => {
  if (lat == null || lng == null) {
    return <div className={styles.mapaVazio}>{HINT_MAPA_VAZIO}</div>;
  }

  return (
    <div className={styles.mapaPreview}>
      <img
        src={urlMapaEstatico(lat, lng)}
        alt="Mapa do local do evento"
        className={styles.mapaImg}
      />
      <div className={styles.mapaOverlay}>
        <span className={styles.badgePonto}>
          <span className={styles.pontoPulse} aria-hidden />
          {BADGE_PONTO}
        </span>
        <span className={`material-symbols-outlined ${styles.iconeBike}`} aria-hidden>
          directions_bike
        </span>
      </div>
    </div>
  );
};
