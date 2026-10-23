"use client";

import type { MencaoOpcao } from "@/app/(app)/stories/hooks/usePublicarStoryPerfil";
import styles from "./composer-story.module.css";

type Props = {
  termo: string;
  onTermo: (valor: string) => void;
  perto: MencaoOpcao | null;
  lista: MencaoOpcao[];
  semResultado: boolean;
  onEscolher: (marca: MencaoOpcao) => void;
};

export const BuscaMarcaStory = ({ termo, onTermo, perto, lista, semResultado, onEscolher }: Props) => (
  <div className={styles.busca}>
    <input
      className={styles.campo}
      value={termo}
      placeholder="Evento ou local"
      onChange={(evento) => onTermo(evento.target.value)}
      autoFocus
    />
    <ul className={styles.lista}>
      {perto ? (
        <li>
          <button type="button" className={styles.item} onClick={() => onEscolher(perto)}>
            Perto de você · @{perto.nome}
          </button>
        </li>
      ) : null}
      {lista.map((item) => (
        <li key={`${item.tipo}-${item.id}`}>
          <button type="button" className={styles.item} onClick={() => onEscolher(item)}>
            @{item.nome}
          </button>
        </li>
      ))}
    </ul>
    {semResultado ? <p className={styles.vazioBusca}>Nenhum evento ou local com esse nome</p> : null}
  </div>
);
