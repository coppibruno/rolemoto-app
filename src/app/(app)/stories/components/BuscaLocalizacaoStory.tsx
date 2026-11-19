"use client";

import type { MencaoOpcao, PontoMencao } from "@/app/(app)/stories/hooks/usePublicarStoryPerfil";
import styles from "./composer-story.module.css";

type Props = {
  termo: string;
  onTermo: (valor: string) => void;
  lugarEncontro: PontoMencao | null;
  lista: MencaoOpcao[];
  listaGeo: PontoMencao[];
  buscandoGeo?: boolean;
  semResultado: boolean;
  onEscolher: (ponto: PontoMencao) => void;
  onEscolherGeo: (ponto: PontoMencao) => void;
  onUsarTextoLivre?: (nome: string) => void;
  ocupadoLivre?: boolean;
};

export const BuscaLocalizacaoStory = ({
  termo,
  onTermo,
  lugarEncontro,
  lista,
  listaGeo,
  buscandoGeo = false,
  semResultado,
  onEscolher,
  onEscolherGeo,
  onUsarTextoLivre,
  ocupadoLivre = false,
}: Props) => {
  const nomeLivre = termo.trim().slice(0, 80);
  const mostrarLivre = Boolean(onUsarTextoLivre && nomeLivre.length >= 3);

  return (
    <div className={styles.busca}>
      <input
        className={styles.campo}
        value={termo}
        placeholder="Buscar lugar (ex.: Urubici, Serra do Corvo Branco)"
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
              {ocupadoLivre ? "Buscando…" : `Usar «${nomeLivre}»`}
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
        {listaGeo.map((ponto) => (
          <li key={`geo-${ponto.lat}-${ponto.lng}-${ponto.nome}`}>
            <button type="button" className={styles.item} onClick={() => onEscolherGeo(ponto)}>
              {ponto.nome}
            </button>
          </li>
        ))}
        {lista.map((item) => {
          const ponto = item.ponto;
          if (!ponto) return null;
          return (
            <li key={item.id}>
              <button type="button" className={styles.item} onClick={() => onEscolher(ponto)}>
                No Rolemoto · {item.nome}
              </button>
            </li>
          );
        })}
      </ul>
      {buscandoGeo ? <p className={styles.vazioBusca}>Buscando lugares…</p> : null}
      {semResultado && !mostrarLivre && !buscandoGeo ? (
        <p className={styles.vazioBusca}>Nenhum lugar com esse nome</p>
      ) : null}
    </div>
  );
};
