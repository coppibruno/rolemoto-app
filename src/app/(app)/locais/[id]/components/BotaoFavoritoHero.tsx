"use client";

import { useFavoritoLocal } from "@/app/(app)/feed/hooks/useFavoritoLocal";
import styles from "../local-detalhe.module.css";

type Props = {
  localId: string;
  nome: string;
  favoritoInicial: boolean;
};

export const BotaoFavoritoHero = ({ localId, nome, favoritoInicial }: Props) => {
  const { favorito, processando, erro, alternar } = useFavoritoLocal({
    localId,
    favoritoInicial,
  });

  return (
    <>
      <button
        type="button"
        className={styles.botaoFavorito}
        aria-pressed={favorito}
        aria-label={
          favorito ? `Remover ${nome} dos favoritos` : `Favoritar ${nome}`
        }
        disabled={processando}
        onClick={() => void alternar()}
      >
        <span
          className="material-symbols-outlined"
          aria-hidden
          style={favorito ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {favorito ? "favorite" : "favorite_border"}
        </span>
      </button>
      {erro ? (
        <p className={styles.toastFavorito} role="alert">
          {erro}
        </p>
      ) : null}
    </>
  );
};
