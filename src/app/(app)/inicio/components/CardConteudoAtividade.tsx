"use client";

import type { ItemAtividade } from "@/types/atividade";
import { ehConteudo } from "@/types/atividade";
import {
  ctaDoItem,
  hrefAlvo,
  verboConteudo,
} from "../atividade-texto";
import { useCompartilharAtividade } from "../hooks/useCompartilharAtividade";
import { useCurtidaAtividade } from "../hooks/useCurtidaAtividade";
import { BarraAcoesAtividade } from "./BarraAcoesAtividade";
import { CabecalhoCardAtividade } from "./CabecalhoCardAtividade";
import { CorpoAvaliacao } from "./CorpoAvaliacao";
import { CorpoEvento } from "./CorpoEvento";
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
  const share = useCompartilharAtividade(item);

  if (!ehConteudo(item.tipo)) return null;

  const href = hrefAlvo(item);
  const cta =
    item.tipo === "role_criado" && item.autor.uid === tokenUid ? null : ctaDoItem(item);

  return (
    <article className={styles.card}>
      <CabecalhoCardAtividade
        autor={item.autor}
        verbo={verboConteudo(item)}
        createdAt={item.createdAt}
        tokenUid={tokenUid}
        atividadeId={item.id}
      />
      {item.alvo.tipo === "post" ? (
        <CorpoFoto
          alvo={item.alvo}
          hrefPost={href}
          onCurtirDuplo={() => void curtida.curtirSo()}
        />
      ) : null}
      {item.alvo.tipo === "telemetria" ? (
        <CorpoTelemetria alvo={item.alvo} href={href} />
      ) : null}
      {item.alvo.tipo === "role" ? (
        <CorpoRole
          alvo={item.alvo}
          href={href}
          realizado={item.tipo === "role_realizado"}
        />
      ) : null}
      {item.alvo.tipo === "evento" ? <CorpoEvento alvo={item.alvo} href={href} /> : null}
      {item.alvo.tipo === "avaliacao" ? <CorpoAvaliacao alvo={item.alvo} /> : null}
      <BarraAcoesAtividade
        curtido={curtida.curtido}
        totalCurtidas={curtida.total}
        totalComentarios={item.totalComentarios}
        podeComentar={item.tipo !== "album_evento"}
        podeCompartilhar={share.podeCompartilhar}
        cta={cta}
        onCurtir={() => void curtida.alternar()}
        onComentar={() => onComentar(item)}
        onCompartilhar={() => void share.compartilhar()}
      />
      {curtida.toast || share.feedback ? (
        <div className={styles.toast} role="status">
          {curtida.toast ?? share.feedback}
        </div>
      ) : null}
    </article>
  );
};
