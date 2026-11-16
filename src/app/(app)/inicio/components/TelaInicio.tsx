"use client";

import { useCallback, useState } from "react";
import { CarrosselStories } from "@/app/(app)/stories/components/CarrosselStories";
import { FaixaConhecer } from "./FaixaConhecer";
import { BannerCockpitLider } from "@/app/(app)/feed/components/BannerCockpitLider";
import { CabecalhoFeed } from "@/app/(app)/feed/components/CabecalhoFeed";
import { CardFeedbackPendente } from "@/app/(app)/feed/components/CardFeedbackPendente";
import { useFeedbackPendente } from "@/app/(app)/feed/hooks/useFeedbackPendente";
import { useResumoAprovacoes } from "@/app/(app)/feed/hooks/useResumoAprovacoes";
import { useAuth } from "@/hooks/useAuth";
import type { ItemAtividade } from "@/types/atividade";
import { ehConteudo } from "@/types/atividade";
import { useFeedAmigos } from "../hooks/useFeedAmigos";
import { useNovidadesInicio } from "../hooks/useNovidadesInicio";
import { CardConteudoAtividade } from "./CardConteudoAtividade";
import { EstadoVazioInicio } from "./EstadoVazioInicio";
import { EsqueletoInicio } from "./EsqueletoInicio";
import { FolhaComentarios } from "./FolhaComentarios";
import { LinhaAtividade } from "./LinhaAtividade";
import { PilulaNovidades } from "./PilulaNovidades";
import styles from "../inicio.module.css";

export const TelaInicio = () => {
  const { usuario } = useAuth();
  const [folha, setFolha] = useState<ItemAtividade | null>(null);
  const feed = useFeedAmigos(true);
  const primeiroId = feed.itens[0]?.id ?? null;
  const novidades = useNovidadesInicio(primeiroId, true);
  const resumoAprovacoes = useResumoAprovacoes();
  const feedbackPendente = useFeedbackPendente();

  const { atualizarItem, itens } = feed;

  const onCurtidaMudou = useCallback(
    (id: string, curtido: boolean, total: number) => {
      atualizarItem(id, { curtidoPorMim: curtido, totalCurtidas: total });
    },
    [atualizarItem],
  );

  const onTotalComentarios = useCallback(
    (id: string, delta: number) => {
      const atual = itens.find((i) => i.id === id);
      if (!atual || atual.totalComentarios == null) return;
      atualizarItem(id, {
        totalComentarios: Math.max(0, atual.totalComentarios + delta),
      });
    },
    [atualizarItem, itens],
  );

  const recarregarTopo = async () => {
    novidades.zerar();
    const painel = document.querySelector("[data-scroll-app]");
    if (painel instanceof HTMLElement) painel.scrollTo({ top: 0, behavior: "smooth" });
    await feed.recarregar();
  };

  const primeiraCarga = feed.carregando && feed.itens.length === 0;
  const vazio = !feed.carregando && !feed.erro && feed.itens.length === 0;

  return (
    <div className={styles.tela}>
      <CabecalhoFeed />
      <PilulaNovidades total={novidades.total} onToque={() => void recarregarTopo()} />
      <div className={styles.corpo}>
        {feedbackPendente.role ? (
          <CardFeedbackPendente
            role={feedbackPendente.role}
            onDispensar={feedbackPendente.dispensar}
          />
        ) : null}

        {resumoAprovacoes ? <BannerCockpitLider resumo={resumoAprovacoes} /> : null}

        <CarrosselStories />
        <FaixaConhecer />

        {primeiraCarga ? <EsqueletoInicio /> : null}

        {feed.erro && feed.itens.length === 0 ? (
          <div className={styles.erroBloco}>
            <p className={styles.erroTexto}>{feed.erro}</p>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={() => void feed.recarregar()}
            >
              Tentar de novo
            </button>
          </div>
        ) : null}

        {vazio ? (
          <EstadoVazioInicio segueAlguem={(usuario?.seguindo ?? 0) > 0} />
        ) : null}

        {feed.itens.length > 0 ? (
          <div className={styles.lista}>
            {feed.itens.map((item) =>
              ehConteudo(item.tipo) ? (
                <CardConteudoAtividade
                  key={item.id}
                  item={item}
                  tokenUid={usuario?.uid}
                  onComentar={setFolha}
                  onCurtidaMudou={onCurtidaMudou}
                />
              ) : (
                <LinhaAtividade
                  key={item.id}
                  item={item}
                  onCurtidaMudou={onCurtidaMudou}
                />
              ),
            )}
            {feed.carregandoMais ? <EsqueletoInicio compacto /> : null}
            <div ref={feed.sentinelaRef} />
            {feed.cursor ? (
              <button
                type="button"
                className={styles.botaoSecundario}
                onClick={() => void feed.carregarMais()}
                disabled={feed.carregandoMais}
              >
                Carregar mais
              </button>
            ) : (
              <p className={styles.fimLista}>Você viu tudo dos últimos dias.</p>
            )}
          </div>
        ) : null}
      </div>

      {folha ? (
        <FolhaComentarios
          item={folha}
          onFechar={() => setFolha(null)}
          onTotalMudou={onTotalComentarios}
        />
      ) : null}
    </div>
  );
};
