"use client";

import type { AlvoAvaliacao } from "../hooks/useAvaliarExperiencia";
import {
  BADGE_OFICIAL,
  LABELS_CATEGORIA_ALVO,
  LABELS_TIPO_EVENTO_ALVO,
} from "../constants";
import styles from "../avaliar.module.css";

type Props = {
  alvo: AlvoAvaliacao;
};

export const CardAlvoAvaliacao = ({ alvo }: Props) => {
  if (alvo.tipo === "local") {
    const { dados } = alvo;
    return (
      <section className={styles.cardAlvo}>
        <div className={styles.cardAlvoInner}>
          <div className={styles.thumb}>
            {dados.fotoFachadaUrl ? (
              <img
                src={dados.fotoFachadaUrl}
                alt=""
                className={styles.thumbImg}
              />
            ) : null}
            <span className={styles.badgeOficial}>{BADGE_OFICIAL}</span>
          </div>
          <div className={styles.alvoMeta}>
            <span className={styles.alvoTipo}>
              <span className="material-symbols-outlined" aria-hidden>
                verified
              </span>
              {LABELS_CATEGORIA_ALVO[dados.categoria]}
            </span>
            <h2 className={styles.alvoTitulo}>{dados.nome}</h2>
            <p className={styles.alvoEndereco}>
              <span className="material-symbols-outlined" aria-hidden>
                location_on
              </span>
              <span>{dados.endereco}</span>
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { dados } = alvo;
  const endereco =
    dados.local.nome.trim() || dados.local.endereco.trim() || "Local";

  return (
    <section className={styles.cardAlvo}>
      <div className={styles.cardAlvoInner}>
        <div className={styles.thumb}>
          {dados.fotoCapaUrl ? (
            <img src={dados.fotoCapaUrl} alt="" className={styles.thumbImg} />
          ) : null}
        </div>
        <div className={styles.alvoMeta}>
          <span className={styles.alvoTipo}>
            <span className="material-symbols-outlined" aria-hidden>
              local_activity
            </span>
            {LABELS_TIPO_EVENTO_ALVO[dados.tipo]}
          </span>
          <h2 className={styles.alvoTitulo}>{dados.titulo}</h2>
          <p className={styles.alvoEndereco}>
            <span className="material-symbols-outlined" aria-hidden>
              location_on
            </span>
            <span>{endereco}</span>
          </p>
        </div>
      </div>
    </section>
  );
};
