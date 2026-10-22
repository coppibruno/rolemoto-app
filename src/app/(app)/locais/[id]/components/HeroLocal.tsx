import Link from "next/link";
import { SeloMediaAvaliacoes } from "@/app/(app)/feed/components/SeloMediaAvaliacoes";
import {
  ICONES_CATEGORIA_LOCAL,
  LABELS_CATEGORIA_LOCAL,
} from "@/app/(app)/feed/constants";
import { labelStatusAberto } from "@/lib/horario-local";
import type { LocalDetalhe } from "@/types/local";
import { BotaoPostarStory } from "@/app/(app)/components/BotaoPostarStory";
import { AnelCapaStory } from "@/app/(app)/feed/components/AnelCapaStory";
import { CTA_VER_REVIEWS } from "../constants";
import { BotaoFavoritoHero } from "./BotaoFavoritoHero";
import styles from "../local-detalhe.module.css";

type Props = {
  local: LocalDetalhe;
  onAbrirStories: () => void;
  onStoryCriada: (storyId: string) => void;
};

export const HeroLocal = ({ local, onAbrirStories, onStoryCriada }: Props) => {
  const status = labelStatusAberto(local);
  const aberto = status !== "Fechado";
  const nomeStory = local.eventoAoVivo?.titulo ?? local.nome;

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
        {local.storiesAtivas > 0 ? (
          <div className={styles.anelHero}>
            <AnelCapaStory
              alvo={{ tipo: "local", id: local.id }}
              nome={nomeStory}
              contagem={local.storiesAtivas}
              onAbrir={onAbrirStories}
            />
          </div>
        ) : null}
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
        <BotaoPostarStory
          alvo={{ tipo: "local", id: local.id }}
          onCriada={(story) => onStoryCriada(story.id)}
        />
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
