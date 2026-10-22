"use client";

import { useState } from "react";
import type { PontoFeed, RaioKm } from "../types";
import { useFaixaStories } from "@/app/(app)/stories/hooks/useFaixaStories";
import { PlayerStories } from "@/app/(app)/components/PlayerStories";
import { alvoDoAnel, type AlvoPlayer } from "@/types/story-local";
import { AnelStory } from "./AnelStory";
import styles from "./faixa-stories.module.css";

type Props = {
  aba: "locais" | "eventos";
  ponto: PontoFeed | null;
  raioKm: RaioKm;
};

const nomeDoAnel = (
  aba: "locais" | "eventos",
  anel: { nome: string; eventoAoVivo: { titulo: string } | null },
) => (aba === "locais" && anel.eventoAoVivo ? anel.eventoAoVivo.titulo : anel.nome);

export const FaixaStories = ({ aba, ponto, raioKm }: Props) => {
  const { aneis, recarregar } = useFaixaStories({ aba, ponto, raioKm });
  const [alvo, setAlvo] = useState<AlvoPlayer | null>(null);

  if (aneis.length === 0 && !alvo) return null;

  return (
    <>
      {aneis.length > 0 ? (
        <div className={styles.faixa} aria-label="Fotos ao vivo">
          {aneis.map((anel) => {
            const nome = nomeDoAnel(aba, anel);
            return (
              <AnelStory
                key={`${anel.album}-${anel.localId ?? ""}-${anel.eventoId ?? ""}`}
                nome={nome}
                fotoUrl={anel.fotoUrl}
                contagem={anel.contagem}
                naoVisto={anel.naoVisto}
                onAbrir={() => setAlvo(alvoDoAnel(anel))}
              />
            );
          })}
        </div>
      ) : null}
      <PlayerStories
        aberto={alvo !== null}
        alvo={alvo}
        onFechar={() => {
          setAlvo(null);
          recarregar();
        }}
        onMudou={recarregar}
      />
    </>
  );
};
