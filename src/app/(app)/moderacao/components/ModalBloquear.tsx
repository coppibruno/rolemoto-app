"use client";

import { useState } from "react";
import { useFocoModal } from "@/hooks/useFocoModal";
import { ApiError } from "@/lib/api";
import { moderacaoService } from "../services/moderacao.service";
import styles from "../moderacao.module.css";

type Props = {
  uid: string;
  apelido: string;
  onCancelar: () => void;
  onBloqueado: (mensagem: string) => void;
};

export const ModalBloquear = ({
  uid,
  apelido,
  onCancelar,
  onBloqueado,
}: Props) => {
  const cartaoRef = useFocoModal(onCancelar);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const confirmar = async () => {
    if (ocupado) return;
    setOcupado(true);
    setErro(null);
    try {
      await moderacaoService.bloquear(uid);
      onBloqueado("Bloqueado.");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível bloquear");
      setOcupado(false);
    }
  };

  return (
    <div className={`${styles.overlay} ${styles.overlayCentro}`} onClick={onCancelar}>
      <div
        ref={cartaoRef}
        className={styles.cartaoModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-bloquear"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id="titulo-bloquear" className={styles.tituloModal}>
          Bloquear {apelido}?
        </h2>
        <p className={styles.corpoModal}>
          Vocês não vão se ver no feed, stories nem conversas. Dá para
          desbloquear depois em Perfil → Bloqueados.
        </p>
        {erro ? (
          <p role="alert" style={{ margin: 0, color: "var(--error)", fontSize: 13 }}>
            {erro}
          </p>
        ) : null}
        <div className={styles.acoesModal}>
          <button
            type="button"
            className={styles.botaoConfirmar}
            onClick={() => void confirmar()}
            disabled={ocupado}
          >
            Bloquear
          </button>
          <button
            type="button"
            className={styles.botaoCancelar}
            onClick={onCancelar}
            data-foco-inicial
            disabled={ocupado}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
