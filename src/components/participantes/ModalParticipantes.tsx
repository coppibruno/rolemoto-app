"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import type { TipoAlvoParticipantes } from "@/types/participante";
import {
  COPY_VAZIO_PARTICIPANTES,
  TITULOS_PARTICIPANTES,
  rotuloTotal,
} from "./constants";
import { useParticipantes } from "./hooks/useParticipantes";
import { ItemParticipante } from "./ItemParticipante";
import styles from "./participantes.module.css";

type Props = {
  tipo: TipoAlvoParticipantes;
  id: string;
  onFechar: () => void;
};

export const ModalParticipantes = ({ tipo, id, onFechar }: Props) => {
  const cartaoRef = useFocoModal(onFechar);
  const { itens, total, carregando, erro } = useParticipantes(tipo, id, true);

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        ref={cartaoRef}
        className={styles.folha}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-participantes"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.folhaTopo}>
          <div>
            <p className={styles.folhaKicker}>{rotuloTotal(tipo, total)}</p>
            <h2 id="titulo-modal-participantes" className={styles.folhaTitulo}>
              {TITULOS_PARTICIPANTES[tipo]}
            </h2>
          </div>
          <button
            type="button"
            className={styles.botaoFechar}
            onClick={onFechar}
            aria-label="Fechar"
            data-foco-inicial
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className={styles.folhaCorpo}>
          {carregando ? (
            <p className={styles.estado}>Carregando…</p>
          ) : erro ? (
            <p className={styles.estadoErro}>{erro}</p>
          ) : itens.length === 0 ? (
            <p className={styles.estado}>{COPY_VAZIO_PARTICIPANTES[tipo]}</p>
          ) : (
            <ul className={styles.lista}>
              {itens.map((p) => (
                <li key={p.uid}>
                  <ItemParticipante participante={p} onNavegar={onFechar} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
