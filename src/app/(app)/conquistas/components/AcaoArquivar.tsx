"use client";

import type { useFormularioConquista } from "../hooks/useFormularioConquista";
import { CONFIRMAR_ARQUIVAR } from "../constants";
import styles from "../conquistas.module.css";

type Props = {
  form: ReturnType<typeof useFormularioConquista>;
};

/** Arquivar pede confirmação de uma linha; republicar vai direto. */
export const AcaoArquivar = ({ form }: Props) => {
  if (!form.ativa) {
    return (
      <button
        type="button"
        className={styles.secundario}
        onClick={() => void form.alternarAtiva()}
        disabled={form.salvando}
      >
        Publicar de novo
      </button>
    );
  }

  if (!form.confirmandoArquivar) {
    return (
      <button
        type="button"
        className={styles.secundario}
        onClick={form.pedirArquivar}
        disabled={form.salvando}
      >
        Arquivar
      </button>
    );
  }

  return (
    <div className={styles.confirmacao} role="alertdialog" aria-label="Confirmar arquivamento">
      <p className={styles.confirmacaoTexto}>{CONFIRMAR_ARQUIVAR}</p>
      <div className={styles.confirmacaoAcoes}>
        <button
          type="button"
          className={styles.perigo}
          onClick={() => void form.alternarAtiva()}
          disabled={form.salvando}
        >
          Arquivar
        </button>
        <button
          type="button"
          className={styles.secundario}
          onClick={form.cancelarArquivar}
          disabled={form.salvando}
        >
          Manter
        </button>
      </div>
    </div>
  );
};
