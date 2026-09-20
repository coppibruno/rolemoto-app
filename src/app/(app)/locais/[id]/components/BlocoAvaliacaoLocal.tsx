import Link from "next/link";
import type { LocalDetalhe } from "@/types/local";
import { CTA_AVALIAR, CTA_VER_AVALIACAO } from "../constants";
import styles from "../local-detalhe.module.css";

type Props = {
  local: LocalDetalhe;
};

export const BlocoAvaliacaoLocal = ({ local }: Props) => (
  <Link href={`/locais/${local.id}/avaliar`} className={styles.ctaAvaliacao}>
    <span className="material-symbols-outlined" aria-hidden>
      star
    </span>
    {local.avaliado ? CTA_VER_AVALIACAO : CTA_AVALIAR}
  </Link>
);
