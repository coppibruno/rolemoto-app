"use client";

import { useState } from "react";
import { VisualizadorFotos } from "@/components/fotos/VisualizadorFotos";
import type { AvaliacaoExperiencia } from "@/types/avaliacao-experiencia";
import { SELO_SEU_RELATO } from "../constants";
import styles from "../avaliar.module.css";

type Props = {
  avaliacao: AvaliacaoExperiencia;
  eMinha: boolean;
};

export const CardAvaliacao = ({ avaliacao, eMinha }: Props) => {
  const { autor } = avaliacao;
  const [fotoAberta, setFotoAberta] = useState<number | null>(null);

  return (
    <article className={styles.cardAvaliacao}>
      <div className={styles.cardAvaliacaoTopo}>
        {autor.fotoUrl ? (
          <img src={autor.fotoUrl} alt="" className={styles.avatar} />
        ) : (
          <span className={styles.avatarFallback} aria-hidden>
            <span className="material-symbols-outlined">person</span>
          </span>
        )}
        <div className={styles.autorInfo}>
          <span className={styles.autorNome}>{autor.nome}</span>
          <span className={styles.autorApelido}>@{autor.apelido}</span>
        </div>
        {eMinha ? <span className={styles.seloSeu}>{SELO_SEU_RELATO}</span> : null}
      </div>
      <div className={styles.notaLinha} aria-label={`${avaliacao.nota} estrelas`}>
        {Array.from({ length: avaliacao.nota }, (_, i) => (
          <span key={i} className="material-symbols-outlined" aria-hidden>
            star
          </span>
        ))}
      </div>
      {avaliacao.comentario ? (
        <p className={styles.comentario}>{avaliacao.comentario}</p>
      ) : null}
      {avaliacao.fotosUrls.length > 0 ? (
        <div className={styles.fotosAvaliacao}>
          {avaliacao.fotosUrls.map((url, indice) => (
            <button
              key={url}
              type="button"
              className={styles.fotoAvaliacao}
              aria-label={`Abrir foto ${indice + 1} de ${avaliacao.fotosUrls.length}`}
              onClick={() => setFotoAberta(indice)}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      ) : null}
      {fotoAberta != null ? (
        <VisualizadorFotos
          fotos={avaliacao.fotosUrls}
          indiceInicial={fotoAberta}
          rotulo={`Fotos de ${autor.nome}`}
          onFechar={() => setFotoAberta(null)}
        />
      ) : null}
      {avaliacao.recomendaComboio ? (
        <span className={styles.badgeRecomenda}>
          <span className="material-symbols-outlined" aria-hidden>
            thumb_up
          </span>
          Recomenda para comboios
        </span>
      ) : null}
    </article>
  );
};
