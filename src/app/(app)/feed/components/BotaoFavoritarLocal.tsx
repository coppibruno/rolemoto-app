"use client";

import { useFavoritoLocal } from "../hooks/useFavoritoLocal";
import styles from "../feed.module.css";

type Props = {
  localId: string;
  nome: string;
  favoritoInicial: boolean;
};

export const BotaoFavoritarLocal = ({
  localId,
  nome,
  favoritoInicial,
}: Props) => {
  const { favorito, processando, alternar } = useFavoritoLocal({
    localId,
    favoritoInicial,
  });

  return (
    <button
      type="button"
      className={styles.botaoFavorito}
      aria-pressed={favorito}
      aria-label={
        favorito ? `Remover ${nome} dos favoritos` : `Favoritar ${nome}`
      }
      disabled={processando}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void alternar();
      }}
    >
      <span
        className="material-symbols-outlined"
        aria-hidden
        style={
          favorito
            ? { fontVariationSettings: "'FILL' 1" }
            : undefined
        }
      >
        {favorito ? "favorite" : "favorite_border"}
      </span>
    </button>
  );
};
