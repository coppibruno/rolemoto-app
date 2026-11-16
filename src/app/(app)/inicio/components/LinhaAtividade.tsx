"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ItemAtividade } from "@/types/atividade";
import {
  ctaDoItem,
  dataDoAlvo,
  hrefAlvo,
  nomesDoGrupo,
  tempoRelativo,
  tituloLinha,
  verboLinha,
} from "../atividade-texto";
import { useCurtidaAtividade } from "../hooks/useCurtidaAtividade";
import styles from "../inicio.module.css";

type Props = {
  item: ItemAtividade;
  onCurtidaMudou: (id: string, curtido: boolean, total: number) => void;
};

export const LinhaAtividade = ({ item, onCurtidaMudou }: Props) => {
  const router = useRouter();
  const curtida = useCurtidaAtividade(
    item.id,
    { curtidoPorMim: item.curtidoPorMim, totalCurtidas: item.totalCurtidas },
    (estado) => onCurtidaMudou(item.id, estado.curtidoPorMim, estado.totalCurtidas),
  );
  const { nomes, extra } = nomesDoGrupo(item);
  const cta = ctaDoItem(item);
  const dataAlvo = dataDoAlvo(item);
  const autores = [item.autor, ...item.outrosAutores].slice(0, 3);

  return (
    <div className={styles.linha}>
      <div
        className={styles.pilhaLinha}
        aria-hidden
        onClick={() => router.push(hrefAlvo(item))}
        onKeyDown={undefined}
        role="presentation"
      >
        {autores.map((a) =>
          a.fotoUrl ? (
            <img
              key={a.uid}
              src={a.fotoUrl}
              alt=""
              className={styles.avatar32}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span key={a.uid} className={styles.avatar32} />
          ),
        )}
      </div>
      <button
        type="button"
        className={styles.linhaMeio}
        style={{
          display: "block",
          border: "none",
          background: "transparent",
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
          flex: 1,
          minWidth: 0,
        }}
        onClick={() => router.push(hrefAlvo(item))}
      >
        <p className={styles.linhaTexto}>
          <strong>{nomes}</strong>
          {extra} {verboLinha(item)} <strong>{tituloLinha(item)}</strong>
        </p>
        <p className={styles.linhaMeta}>
          {tempoRelativo(item.createdAt)}
          {dataAlvo ? ` · ${dataAlvo}` : ""}
        </p>
      </button>
      <div className={styles.linhaDireita}>
        {item.podeCurtir ? (
          <button
            type="button"
            className={`${styles.acao} ${styles.acaoCurtida} ${curtida.curtido ? styles.acaoCurtidaAtiva : ""}`}
            aria-label={curtida.curtido ? "Descurtir" : "Curtir"}
            onClick={() => void curtida.alternar()}
          >
            <span className="material-symbols-outlined" aria-hidden>
              favorite
            </span>
            {curtida.total > 0 ? curtida.total : null}
          </button>
        ) : null}
        {cta ? (
          <Link href={cta.href} className={styles.ctaChip}>
            {cta.rotulo}
          </Link>
        ) : null}
      </div>
      {curtida.toast ? (
        <div className={styles.toast} role="status">
          {curtida.toast}
        </div>
      ) : null}
    </div>
  );
};
