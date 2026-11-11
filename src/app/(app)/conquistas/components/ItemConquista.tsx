import type { ConquistaAdmin } from "@/types/conquista";
import styles from "../conquistas.module.css";

type Props = {
  item: ConquistaAdmin;
  onAbrir: () => void;
};

export const ItemConquista = ({ item, onAbrir }: Props) => (
  <button
    type="button"
    className={`${styles.item} ${item.ativa ? "" : styles.itemArquivado}`}
    onClick={onAbrir}
  >
    <span className={`material-symbols-outlined ${styles.itemIcone}`} aria-hidden>
      military_tech
    </span>
    <span className={styles.itemTextos}>
      <span className={styles.itemNome}>{item.nome}</span>
      <span className={styles.itemMeta}>Raio {item.raioMetros} m</span>
    </span>
    {item.ativa ? null : <span className={styles.badgeArquivada}>Arquivada</span>}
    <span className="material-symbols-outlined" aria-hidden>
      chevron_right
    </span>
  </button>
);
