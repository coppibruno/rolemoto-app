import Link from "next/link";
import { CTA_BALCAO } from "../constants";
import styles from "../ofertas.module.css";

type Props = {
  localId: string;
};

export const LinkBalcao = ({ localId }: Props) => (
  <Link href={`/locais/${localId}/balcao`} className={styles.linkBalcao}>
    <span className="material-symbols-outlined" aria-hidden>
      storefront
    </span>
    {CTA_BALCAO}
  </Link>
);
