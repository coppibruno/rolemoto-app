"use client";

import { CHECKLIST_TEXTO, CHECKLIST_TITULO } from "../constants";
import styles from "../confirmacao-role.module.css";

export const ChecklistPrePista = () => {
  return (
    <div className={styles.checklist}>
      <div className={styles.checklistIcone}>
        <span className="material-symbols-outlined">tune</span>
      </div>
      <div>
        <div className={styles.checklistTitulo}>{CHECKLIST_TITULO}</div>
        <p className={styles.checklistTexto}>{CHECKLIST_TEXTO}</p>
      </div>
    </div>
  );
};
