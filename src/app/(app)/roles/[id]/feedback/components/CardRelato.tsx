"use client";

import type { UsuarioRoleFeedback } from "@/types/usuario-role-feedback";
import { LABEL_TAG, SELO_SEU_RELATO } from "../constants";
import styles from "../feedback-role.module.css";

type Props = {
  relato: UsuarioRoleFeedback;
  eMeu: boolean;
};

const ESTRELAS = [1, 2, 3, 4, 5] as const;

export const CardRelato = ({ relato, eMeu }: Props) => {
  const foto = relato.autor.fotoUrl;
  const nome = relato.autor.nome || "Piloto";
  const apelido = relato.autor.apelido || "piloto";

  return (
    <article className={styles.cardRelato}>
      <div className={styles.cardRelatoTopo}>
        {foto ? (
          <img
            src={foto}
            alt={`Foto de ${nome}`}
            className={styles.avatarRelato}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={styles.avatarPlaceholder} aria-hidden>
            <span className="material-symbols-outlined">account_circle</span>
          </span>
        )}
        <div className={styles.relatoIdentidade}>
          <span className={styles.relatoApelido}>@{apelido}</span>
          {eMeu ? <span className={styles.seloSeu}>{SELO_SEU_RELATO}</span> : null}
        </div>
        <div className={styles.estrelasLeitura} aria-label={`${relato.nota} de 5`}>
          {ESTRELAS.map((n) => (
            <span
              key={n}
              className={`material-symbols-outlined ${
                n <= relato.nota
                  ? styles.estrelaLeituraCheia
                  : styles.estrelaLeituraVazia
              }`}
              aria-hidden
            >
              star
            </span>
          ))}
        </div>
      </div>
      {relato.tags.length > 0 ? (
        <div className={styles.relatoTags}>
          {relato.tags.map((tag) => (
            <span key={tag} className={styles.tagLeitura}>
              {LABEL_TAG[tag] ?? tag}
            </span>
          ))}
        </div>
      ) : null}
      {relato.comentario ? (
        <p className={styles.relatoComentario}>{relato.comentario}</p>
      ) : null}
    </article>
  );
};
