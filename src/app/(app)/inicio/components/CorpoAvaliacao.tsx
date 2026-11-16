"use client";

import { useState } from "react";
import Link from "next/link";
import { VisualizadorFotos } from "@/components/fotos/VisualizadorFotos";
import type { AlvoAvaliacao } from "@/types/atividade";
import styles from "../inicio.module.css";

type Props = { alvo: AlvoAvaliacao };

export const CorpoAvaliacao = ({ alvo }: Props) => {
  const [aberta, setAberta] = useState(false);
  const [fotoIdx, setFotoIdx] = useState(0);
  const href =
    alvo.alvoTipo === "local"
      ? `/locais/${encodeURIComponent(alvo.alvoId)}`
      : `/eventos/${encodeURIComponent(alvo.alvoId)}`;

  return (
    <div className={styles.blocoConteudo}>
      <div className={styles.estrelas} aria-label={`${alvo.nota} estrelas`}>
        {Array.from({ length: alvo.nota }, (_, i) => (
          <span key={i} className="material-symbols-outlined" aria-hidden>
            star
          </span>
        ))}
      </div>
      {alvo.comentario ? (
        <Relato texto={alvo.comentario} />
      ) : null}
      {alvo.fotosUrls.length > 0 ? (
        <div className={styles.miniaturas}>
          {alvo.fotosUrls.slice(0, 4).map((url, i) => (
            <button
              key={url}
              type="button"
              className={styles.miniatura}
              aria-label={`Abrir foto ${i + 1}`}
              onClick={() => {
                setFotoIdx(i);
                setAberta(true);
              }}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      ) : null}
      {alvo.recomendaComboio ? (
        <span className={styles.seloRecomenda}>
          <span className="material-symbols-outlined" aria-hidden>
            thumb_up
          </span>
          Recomenda para comboio
        </span>
      ) : null}
      <Link href={href} className={styles.linhaAlvo}>
        <span className="material-symbols-outlined" aria-hidden>
          {alvo.alvoTipo === "local" ? "location_on" : "event"}
        </span>
        {alvo.alvoNome}
      </Link>
      {aberta ? (
        <VisualizadorFotos
          fotos={alvo.fotosUrls}
          indiceInicial={fotoIdx}
          rotulo={`Fotos de ${alvo.alvoNome}`}
          onFechar={() => setAberta(false)}
        />
      ) : null}
    </div>
  );
};

const Relato = ({ texto }: { texto: string }) => {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <p className={`${styles.relato} ${aberto ? "" : styles.relatoCurto}`}>{texto}</p>
      {!aberto && texto.length > 160 ? (
        <button type="button" className={styles.mais} onClick={() => setAberto(true)}>
          mais
        </button>
      ) : null}
    </>
  );
};
