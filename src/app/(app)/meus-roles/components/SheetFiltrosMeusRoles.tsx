"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import type { PapelMeuRole } from "@/types/meus-roles";
import type { RitmoRole } from "@/types/role";
import { OPCOES_PAPEL, OPCOES_RITMO } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  ritmo: RitmoRole | "todas";
  papel: PapelMeuRole | "todos";
  onRitmo: (valor: RitmoRole | "todas") => void;
  onPapel: (valor: PapelMeuRole | "todos") => void;
  onLimpar: () => void;
  onFechar: () => void;
};

export const SheetFiltrosMeusRoles = ({
  ritmo,
  papel,
  onRitmo,
  onPapel,
  onLimpar,
  onFechar,
}: Props) => {
  const ref = useFocoModal(onFechar);

  return (
    <>
      <div className={styles.overlay} onClick={onFechar} aria-hidden />
      <div
        ref={ref}
        id="sheet-filtros-meus-roles"
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-filtros-meus-roles"
      >
        <h2 id="titulo-filtros-meus-roles" className={styles.sheetTitulo}>
          Filtros
        </h2>
        <p className={styles.sheetGrupo}>Ritmo</p>
        <div className={styles.chips}>
          {OPCOES_RITMO.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              className={ritmo === opcao.id ? `${styles.chip} ${styles.chipAtivo}` : styles.chip}
              onClick={() => onRitmo(opcao.id)}
            >
              {opcao.label}
            </button>
          ))}
        </div>
        <p className={styles.sheetGrupo}>Papel</p>
        <div className={styles.chips}>
          {OPCOES_PAPEL.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              className={papel === opcao.id ? `${styles.chip} ${styles.chipAtivo}` : styles.chip}
              onClick={() => onPapel(opcao.id)}
            >
              {opcao.label}
            </button>
          ))}
        </div>
        <div className={styles.sheetAcoes}>
          <button type="button" className={styles.botaoLimpar} onClick={onLimpar}>
            Limpar
          </button>
          <button type="button" className={styles.ctaHero} onClick={onFechar} data-foco-inicial>
            Aplicar
          </button>
        </div>
      </div>
    </>
  );
};
