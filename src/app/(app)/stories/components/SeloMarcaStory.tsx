"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { estiloMarca, estiloSelo, type CorSelo, type PosicaoMarca } from "../marca-story";
import styles from "./composer-story.module.css";

type Props = {
  nome: string;
  posicao: PosicaoMarca;
  cor: CorSelo;
  travado: boolean;
  onSegurar: (evento: ReactPointerEvent<HTMLElement>) => void;
  onMover: (evento: ReactPointerEvent<HTMLElement>) => void;
  onSoltar: (evento: ReactPointerEvent<HTMLElement>) => void;
  onTirar: () => void;
};

export const SeloMarcaStory = ({
  nome,
  posicao,
  cor,
  travado,
  onSegurar,
  onMover,
  onSoltar,
  onTirar,
}: Props) => (
  <div
    className={styles.selo}
    style={{ ...estiloMarca(posicao), ...estiloSelo(cor) }}
    role="group"
    aria-label={`Marca @${nome}. Arraste para posicionar. Toque para mudar a cor.`}
    draggable={false}
    onDragStart={(evento) => evento.preventDefault()}
    onPointerDown={onSegurar}
    onPointerMove={onMover}
    onPointerUp={onSoltar}
    onPointerCancel={onSoltar}
  >
    <span className={styles.seloNome}>@{nome}</span>
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
