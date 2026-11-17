"use client";

import { useEffect, useRef, useState } from "react";
import { DURACAO_CORACAO_MS } from "@/app/(app)/inicio/constants";
import styles from "../post-foto.module.css";

const JANELA_MS = 300;

type Props = {
  fotoUrl: string;
  legenda: string;
  onCurtirDuplo: () => void;
};

export const FotoComToqueDuplo = ({ fotoUrl, legenda, onCurtirDuplo }: Props) => {
  const [flash, setFlash] = useState(false);
  const ultimoRef = useRef(0);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(false), DURACAO_CORACAO_MS);
    return () => window.clearTimeout(t);
  }, [flash]);

  const aoToque = () => {
    const agora = Date.now();
    if (agora - ultimoRef.current < JANELA_MS) {
      ultimoRef.current = 0;
      window.getSelection()?.removeAllRanges();
      setFlash(true);
      onCurtirDuplo();
      return;
    }
    ultimoRef.current = agora;
  };

  return (
    <button
      type="button"
      className={styles.fotoBotao}
      aria-label="Foto"
      onClick={aoToque}
    >
      <img src={fotoUrl} alt={legenda || "Foto"} className={styles.foto} />
      {flash ? (
        <span className={styles.coracaoFlash} aria-hidden>
          <span className="material-symbols-outlined">favorite</span>
        </span>
      ) : null}
    </button>
  );
};
