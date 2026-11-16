"use client";

import type { ItemAtividade } from "@/types/atividade";
import { ehConteudo } from "@/types/atividade";
import {
  ctaDoItem,
  hrefAlvo,
  verboConteudo,
} from "../atividade-texto";
import { useCurtidaAtividade } from "../hooks/useCurtidaAtividade";
import { BarraAcoesAtividade } from "./BarraAcoesAtividade";
import { CabecalhoCardAtividade } from "./CabecalhoCardAtividade";
import { CorpoAvaliacao } from "./CorpoAvaliacao";
import { CorpoFoto } from "./CorpoFoto";
import { CorpoRole } from "./CorpoRole";
import { CorpoTelemetria } from "./CorpoTelemetria";
import styles from "../inicio.module.css";

type Props = {
  item: ItemAtividade;
  tokenUid: string | undefined;
  onComentar: (item: ItemAtividade) => void;
  onCurtidaMudou: (id: string, curtido: boolean, total: number) => void;
};

export const CardConteudoAtividade = ({
  item,
  tokenUid,
  onComentar,
  onCurtidaMudou,
}: Props) => {
  const curtida = useCurtidaAtividade(
    item.id,
    { curtidoPorMim: item.curtidoPorMim, totalCurtidas: item.totalCurtidas },
    (estado) => onCurtidaMudou(item.id, estado.curtidoPorMim, estado.totalCurtidas),
  );

  if (!ehConteudo(item.tipo)) return null;

  const cta =
    item.tipo === "role_criado" && item.autor.uid === tokenUid ? null : ctaDoItem(item);

  return (
    <article className={styles.card}>
      <CabecalhoCardAtividade
        autor={item.autor}
        verbo={verboConteudo(item)}
        createdAt={item.createdAt}
        tokenUid={tokenUid}
      />
      {item.alvo.tipo === "post" ? (
        <CorpoFoto
          alvo={item.alvo}
          hrefPost={hrefAlvo(item)}
          onCurtirDuplo={() => void curtida.curtirSo()}
        />
      ) : null}
      {item.alvo.tipo === "telemetria" ? <CorpoTelemetria alvo={item.alvo} /> : null}
      {item.alvo.tipo === "role" ? (
        <CorpoRole alvo={item.alvo} realizado={item.tipo === "role_realizado"} />
      ) : null}
      {item.alvo.tipo === "avaliacao" ? <CorpoAvaliacao alvo={item.alvo} /> : null}
      <BarraAcoesAtividade
        curtido={curtida.curtido}
        totalCurtidas={curtida.total}
        totalComentarios={item.totalComentarios}
        podeComentar
        cta={cta}
        onCurtir={() => void curtida.alternar()}
        onComentar={() => onComentar(item)}
      />
      {curtida.toast ? (
        <div className={styles.toast} role="status">
          {curtida.toast}
        </div>
      ) : null}
    </article>
  );
};
