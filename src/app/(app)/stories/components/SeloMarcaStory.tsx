"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { estiloMarca, type PosicaoMarca } from "../marca-story";
import styles from "./composer-story.module.css";

type Props = {
  nome: string;
  posicao: PosicaoMarca;
  travado: boolean;
  onSegurar: (evento: ReactPointerEvent<HTMLElement>) => void;
  onMover: (evento: ReactPointerEvent<HTMLElement>) => void;
  onSoltar: (evento: ReactPointerEvent<HTMLElement>) => void;
  onTirar: () => void;
};

export const SeloMarcaStory = ({
  nome,
  posicao,
  travado,
  onSegurar,
  onMover,
  onSoltar,
  onTirar,
}: Props) => (
  <div
    className={styles.selo}
    style={estiloMarca(posicao)}
    role="group"
    aria-label={`Marca @${nome}. Arraste para posicionar.`}
    draggable={false}
    onDragStart={(evento) => evento.preventDefault()}
    onPointerDown={onSegurar}
    onPointerMove={onMover}
    onPointerUp={onSoltar}
    onPointerCancel={onSoltar}
  >
    <button type="button" className={styles.seloNome} aria-label={`Arrastar marca @${nome}`}>
      @{nome}
    </button>
    <button
      type="button"
      className={styles.tirar}
      data-tirar-marca=""
      aria-label="Tirar marca"
      disabled={travado}
      onPointerDown={(evento) => evento.stopPropagation()}
      onClick={onTirar}
    >
      <span className="material-symbols-outlined" aria-hidden>
        close
      </span>
    </button>
  </div>
);
