import Link from "next/link";
import { SeloMediaAvaliacoes } from "@/app/(app)/feed/components/SeloMediaAvaliacoes";
import {
  ICONES_CATEGORIA_LOCAL,
  LABELS_CATEGORIA_LOCAL,
} from "@/app/(app)/feed/constants";
import { labelStatusAberto } from "@/lib/horario-local";
import type { LocalDetalhe } from "@/types/local";
import { CTA_VER_REVIEWS } from "../constants";
import { BotaoFavoritoHero } from "./BotaoFavoritoHero";
import styles from "../local-detalhe.module.css";

type Props = {
  local: LocalDetalhe;
};

export const HeroLocal = ({ local }: Props) => {
  const status = labelStatusAberto(local);
  const aberto = status !== "Fechado";

  return (
    <section className={styles.hero}>
      <div className={local.fotoFachadaUrl ? styles.heroCapa : styles.heroCapaVazia}>
        {local.fotoFachadaUrl ? (
          <img src={local.fotoFachadaUrl} alt="" className={styles.heroCapaImg} />
        ) : (
          <span className="material-symbols-outlined" aria-hidden>
            {ICONES_CATEGORIA_LOCAL[local.categoria]}
          </span>
        )}
        <div className={styles.heroGradiente} />
        <div className={styles.heroTopo}>
          <span
            className={`${styles.badgeStatus} ${aberto ? styles.badgeAberto : styles.badgeFechado}`}
          >
            <span className={styles.pontoStatus} aria-hidden />
            {status}
          </span>
          <BotaoFavoritoHero
            localId={local.id}
            nome={local.nome}
            favoritoInicial={Boolean(local.favorito)}
          />
        </div>
      </div>
      <div className={styles.heroCorpo}>
        <span className={styles.badgeCategoria}>
          <span className="material-symbols-outlined" aria-hidden>
            {ICONES_CATEGORIA_LOCAL[local.categoria]}
          </span>
          {LABELS_CATEGORIA_LOCAL[local.categoria]}
        </span>
        <h2 className={styles.tituloHero}>{local.nome}</h2>
        <div className={styles.linhaAvaliacao}>
          <SeloMediaAvaliacoes
            notaMedia={local.notaMedia ?? 0}
            totalAvaliacoes={local.totalAvaliacoes ?? 0}
            href={`/locais/${local.id}/avaliacoes`}
          />
          <Link href={`/locais/${local.id}/avaliacoes`} className={styles.linkReviews}>
            {CTA_VER_REVIEWS}
            <span className="material-symbols-outlined" aria-hidden>
              chevron_right
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};
