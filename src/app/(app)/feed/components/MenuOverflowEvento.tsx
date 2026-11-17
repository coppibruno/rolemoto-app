"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DadosConviteEvento } from "@/lib/convite-evento";
import { useCompartilharEvento } from "@/app/(app)/eventos/[id]/hooks/useCompartilharEvento";
import styles from "../feed.module.css";

type Props = {
  id: string;
  dados: DadosConviteEvento;
  podeConvidar: boolean;
};

export const MenuOverflowEvento = ({ id, dados, podeConvidar }: Props) => {
  const { compartilhar, feedback } = useCompartilharEvento(dados);
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (evento: PointerEvent) => {
      if (raizRef.current?.contains(evento.target as Node)) return;
      setAberto(false);
    };
    window.addEventListener("pointerdown", fechar);
    return () => window.removeEventListener("pointerdown", fechar);
  }, [aberto]);

  return (
    <div className={styles.overflowEvento} ref={raizRef}>
      <button
        type="button"
        className={styles.botaoOverflowEvento}
        aria-label="Mais ações do evento"
        aria-expanded={aberto}
        onClick={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          setAberto((atual) => !atual);
        }}
      >
        <span className="material-symbols-outlined" aria-hidden>
          more_vert
        </span>
      </button>
      {aberto ? (
        <div className={styles.menuOverflowEvento} role="menu">
          <button
            type="button"
            className={styles.itemOverflowEvento}
            role="menuitem"
            onClick={(evento) => {
              evento.preventDefault();
              evento.stopPropagation();
              setAberto(false);
              void compartilhar();
            }}
          >
            <span className="material-symbols-outlined" aria-hidden>
              share
            </span>
            Compartilhar
          </button>
          {podeConvidar ? (
            <Link
              href={`/eventos/${id}/convidar`}
              className={styles.itemOverflowEvento}
              role="menuitem"
              onClick={(evento) => evento.stopPropagation()}
            >
              <span className="material-symbols-outlined" aria-hidden>
                person_add
              </span>
              Convidar amigo
            </Link>
          ) : null}
        </div>
      ) : null}
      {feedback ? (
        <span className={styles.toastCopiado} role="status">
          {feedback}
        </span>
      ) : null}
    </div>
  );
};
