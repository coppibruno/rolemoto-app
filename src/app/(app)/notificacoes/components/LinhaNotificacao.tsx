"use client";

import { tempoRelativo } from "@/app/(app)/inicio/atividade-texto";
import type { NotificacaoInboxItem } from "@/types/notificacao";
import { iconeDoTipo } from "../constants";
import styles from "../notificacoes.module.css";

type Props = {
  item: NotificacaoInboxItem;
  onAbrir: (item: NotificacaoInboxItem) => void;
};

export const LinhaNotificacao = ({ item, onAbrir }: Props) => {
  const naoLida = !item.lida;

  return (
    <li>
      <button
        type="button"
        className={`${styles.linha} ${naoLida ? styles.linhaNaoLida : ""}`}
        onClick={() => onAbrir(item)}
      >
        {item.ator?.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.avatar}
            src={item.ator.fotoUrl}
            alt=""
            width={44}
            height={44}
          />
        ) : (
          <span className={styles.iconeTipo} aria-hidden>
            <span className="material-symbols-outlined">{iconeDoTipo(item.tipo)}</span>
          </span>
        )}
        <div className={styles.corpo}>
          <p className={styles.tituloLinha}>{item.title}</p>
          {item.body && item.body !== item.title ? (
            <p className={styles.corpoLinha}>{item.body}</p>
          ) : null}
        </div>
        <div className={styles.meta}>
          <span className={styles.tempo}>{tempoRelativo(item.createdAt)}</span>
          {naoLida ? <span className={styles.ponto} aria-label="Não lida" /> : null}
        </div>
      </button>
    </li>
  );
};
