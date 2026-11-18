"use client";

import type { MencaoOpcao, PontoMencao } from "@/app/(app)/stories/hooks/usePublicarStoryPerfil";
import styles from "./composer-story.module.css";

type Props = {
  termo: string;
  onTermo: (valor: string) => void;
  lugarEncontro: PontoMencao | null;
  lista: MencaoOpcao[];
  semResultado: boolean;
  onEscolher: (ponto: PontoMencao) => void;
  onUsarTextoLivre?: (nome: string) => void;
  ocupadoLivre?: boolean;
};

export const BuscaLocalizacaoStory = ({
  termo,
  onTermo,
  lugarEncontro,
  lista,
  semResultado,
  onEscolher,
  onUsarTextoLivre,
  ocupadoLivre = false,
}: Props) => {
  const nomeLivre = termo.trim().slice(0, 80);
  const mostrarLivre = Boolean(onUsarTextoLivre && nomeLivre.length > 0);

  return (
    <div className={styles.busca}>
      <input
        className={styles.campo}
        value={termo}
        placeholder="Local (ex.: Urubici, Serra do Corvo Branco)"
        onChange={(evento) => onTermo(evento.target.value)}
        autoFocus
      />
      <ul className={styles.lista}>
        {mostrarLivre ? (
          <li>
            <button
              type="button"
              className={styles.item}
              disabled={ocupadoLivre}
              onClick={() => onUsarTextoLivre?.(nomeLivre)}
            >
              {ocupadoLivre ? "Obtendo GPS…" : `Usar «${nomeLivre}»`}
            </button>
          </li>
        ) : null}
        {lugarEncontro ? (
          <li>
            <button type="button" className={styles.item} onClick={() => onEscolher(lugarEncontro)}>
              Lugar do encontro · {lugarEncontro.nome}
            </button>
          </li>
        ) : null}
        {lista.map((item) => {
          const ponto = item.ponto;
          if (!ponto) return null;
          return (
            <li key={item.id}>
              <button type="button" className={styles.item} onClick={() => onEscolher(ponto)}>
                {item.nome}
              </button>
            </li>
          );
        })}
      </ul>
      {semResultado && !mostrarLivre ? (
        <p className={styles.vazioBusca}>Nenhum local com esse nome</p>
      ) : null}
    </div>
  );
};
