"use client";

import { useState } from "react";
import { OPCOES_TIPO } from "@/app/(app)/criar-evento/constants";
import { labelCountdownEvento } from "@/lib/countdown-evento";
import { VisualizadorFotos } from "@/components/fotos/VisualizadorFotos";
import type { EventoDetalhe } from "@/types/evento";
import type { StoryPublica } from "@/types/story-local";
import { BotaoPostarStory } from "@/app/(app)/components/BotaoPostarStory";
import { AnelCapaStory } from "@/app/(app)/feed/components/AnelCapaStory";
import styles from "../evento-detalhe.module.css";

type Props = {
  evento: EventoDetalhe;
  onAbrirStories: () => void;
  onStoryCriada: (story: StoryPublica) => void;
};

export const HeroEvento = ({ evento, onAbrirStories, onStoryCriada }: Props) => {
  const tipo = OPCOES_TIPO.find((item) => item.valor === evento.tipo);
  const countdown = labelCountdownEvento(
    evento.dataHoraAbertura,
    evento.dataHoraEncerramento,
  );
  const alvoAlbum = evento.localId
    ? { tipo: "local" as const, id: evento.localId }
    : { tipo: "evento" as const, id: evento.id };
  const [fotoAberta, setFotoAberta] = useState(false);

  return (
    <section className={styles.hero}>
      <div className={evento.fotoCapaUrl ? styles.heroCapa : styles.heroCapaVazia}>
        {evento.fotoCapaUrl ? (
          <button
            type="button"
            className={styles.botaoCapa}
            aria-label={`Ver foto de ${evento.titulo} inteira`}
            onClick={() => setFotoAberta(true)}
          >
            <img src={evento.fotoCapaUrl} alt="" className={styles.heroCapaImg} />
          </button>
        ) : (
          <span className="material-symbols-outlined" aria-hidden>
            local_activity
          </span>
        )}
        <div className={styles.heroGradiente} />
        {evento.storiesAtivas > 0 ? (
          <div className={styles.anelHero}>
            <AnelCapaStory
              alvo={alvoAlbum}
              nome={evento.titulo}
              contagem={evento.storiesAtivas}
              onAbrir={onAbrirStories}
            />
          </div>
        ) : null}
        <div className={styles.heroBadges}>
          <span className={styles.badgeTipo}>
            <span className="material-symbols-outlined" aria-hidden>
              {tipo?.icone ?? "sports_motorsports"}
            </span>
            {tipo?.label ?? evento.tipo}
          </span>
          <span className={styles.pillCountdown}>{countdown}</span>
        </div>
      </div>
      <div className={styles.heroCorpo}>
        <h2 className={styles.tituloHero}>{evento.titulo}</h2>
        {evento.podePostarStory ? (
          <BotaoPostarStory
            alvo={{ tipo: "evento", id: evento.id, localId: evento.localId }}
            nome={evento.titulo}
            onCriada={onStoryCriada}
          />
        ) : null}
      </div>
      {fotoAberta && evento.fotoCapaUrl ? (
        <VisualizadorFotos
          fotos={[evento.fotoCapaUrl]}
          indiceInicial={0}
          rotulo={`Foto de ${evento.titulo}`}
          onFechar={() => setFotoAberta(false)}
        />
      ) : null}
    </section>
  );
};
