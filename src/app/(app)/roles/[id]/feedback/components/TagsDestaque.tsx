"use client";

import type { TagFeedback } from "@/types/usuario-role-feedback";
import { LABEL_TAGS, TAGS_UI } from "../constants";
import styles from "../feedback-role.module.css";

type Props = {
  selecionadas: Set<TagFeedback>;
  onToggle: (tag: TagFeedback) => void;
};

export const TagsDestaque = ({ selecionadas, onToggle }: Props) => {
  return (
    <section className={styles.blocoTags}>
      <span className={styles.labelSecao}>{LABEL_TAGS}</span>
      <div className={styles.chips}>
        {TAGS_UI.map((tag) => {
          const ativo = selecionadas.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              className={`${styles.chip} ${ativo ? styles.chipAtivo : ""}`}
              aria-pressed={ativo}
              onClick={() => onToggle(tag.id)}
            >
              <span className="material-symbols-outlined" aria-hidden>
                {ativo ? "check_circle" : tag.icone}
              </span>
              {tag.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};
