"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AlvoPost } from "@/types/atividade";
import { ChipMarcaPost } from "@/app/(app)/perfil/[uid]/fotos/[postId]/components/ChipMarcaPost";
import { DURACAO_CORACAO_MS } from "../constants";
import styles from "../inicio.module.css";

const JANELA_MS = 300;

type Props = {
  alvo: AlvoPost;
  hrefPost: string;
  onCurtirDuplo: () => void;
};

export const CorpoFoto = ({ alvo, hrefPost, onCurtirDuplo }: Props) => {
  const router = useRouter();
  const [flash, setFlash] = useState(false);
  const [legendaAberta, setLegendaAberta] = useState(false);
  const ultimoRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(false), DURACAO_CORACAO_MS);
    return () => window.clearTimeout(t);
  }, [flash]);

  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const aoToque = () => {
    const agora = Date.now();
    if (agora - ultimoRef.current < JANELA_MS) {
      ultimoRef.current = 0;
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      window.getSelection()?.removeAllRanges();
      setFlash(true);
      onCurtirDuplo();
      return;
    }
    ultimoRef.current = agora;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      router.push(hrefPost);
    }, JANELA_MS);
  };

  return (
    <>
      <button type="button" className={styles.fotoPost} aria-label="Abrir foto" onClick={aoToque}>
        <img src={alvo.fotoUrl} alt={alvo.legenda || "Foto"} />
        {flash ? (
          <span className={styles.coracaoFlash} aria-hidden>
            <span className="material-symbols-outlined">favorite</span>
          </span>
        ) : null}
      </button>
      <div className={styles.corpoCard}>
        {alvo.marca ? <ChipMarcaPost marca={alvo.marca} /> : null}
        {alvo.legenda ? (
          <>
            <p className={`${styles.legenda} ${legendaAberta ? "" : styles.legendaCurta}`}>
              {alvo.legenda}
            </p>
            {!legendaAberta && alvo.legenda.length > 120 ? (
              <button type="button" className={styles.mais} onClick={() => setLegendaAberta(true)}>
                mais
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
};
