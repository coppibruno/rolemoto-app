import { BANNER_RAIO } from "../constants";
import styles from "../criar-evento.module.css";

export const BannerRaio = () => {
  return (
    <div className={styles.bannerRaio}>
      <span className="material-symbols-outlined" aria-hidden>
        notifications_active
      </span>
      <p>{BANNER_RAIO}</p>
    </div>
  );
};
