"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CampoComentario } from "@/components/comentarios/CampoComentario";
import { ItemComentario } from "@/components/comentarios/ItemComentario";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import type { ItemAtividade } from "@/types/atividade";
import { ehConteudo } from "@/types/atividade";
import { CardConteudoAtividade } from "@/app/(app)/inicio/components/CardConteudoAtividade";
import { LinhaAtividade } from "@/app/(app)/inicio/components/LinhaAtividade";
import { useComentariosAtividade } from "@/app/(app)/inicio/hooks/useComentariosAtividade";
import { inicioService } from "@/app/(app)/inicio/services/inicio.service";
import { useCamadaCheia } from "@/app/(app)/stories/camada-cheia";
import styles from "@/app/(app)/inicio/inicio.module.css";

type Props = { atividadeId: string };

export const TelaAtividade = ({ atividadeId }: Props) => {
  useCamadaCheia(true);
  const router = useRouter();
  const { usuario } = useAuth();
  const [item, setItem] = useState<ItemAtividade | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setNaoEncontrado(false);
    try {
      const dados = await inicioService.item(atividadeId);
      if (dados.tipo === "foto" && dados.alvo.tipo === "post") {
        router.replace(
          `/perfil/${encodeURIComponent(dados.autor.uid)}/fotos/${encodeURIComponent(dados.alvo.id)}`,
        );
        return;
      }
      setItem(dados);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNaoEncontrado(true);
      else setNaoEncontrado(true);
    } finally {
      setCarregando(false);
    }
  }, [atividadeId, router]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const onTotal = useCallback((delta: number) => {
    setItem((atual) =>
      atual && atual.totalComentarios != null
        ? { ...atual, totalComentarios: Math.max(0, atual.totalComentarios + delta) }
        : atual,
    );
  }, []);

  const comentarios = useComentariosAtividade(
    item && ehConteudo(item.tipo) ? item.id : null,
    onTotal,
  );

  return (
    <div className={styles.telaAtividade}>
      <header className={styles.cabecalhoAtividade}>
        <Link href="/" className={styles.voltar} aria-label="Voltar">
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
        </Link>
        <h1 className={styles.tituloAtividade}>Atividade</h1>
        <span className={styles.espaco} />
      </header>

      <div className={styles.corpoAtividade}>
        {carregando ? <p className={styles.erroTexto}>Carregando…</p> : null}
        {naoEncontrado ? (
          <div className={styles.vazio}>
            <p className={styles.vazioTexto}>Este item não está mais disponível</p>
            <Link href="/" className={styles.vazioLink}>
              Voltar ao Início
            </Link>
          </div>
        ) : null}
        {item ? (
          ehConteudo(item.tipo) ? (
            <CardConteudoAtividade
              item={item}
              tokenUid={usuario?.uid}
              onComentar={() => undefined}
              onCurtidaMudou={(id, curtido, total) =>
                setItem((atual) =>
                  atual && atual.id === id
                    ? { ...atual, curtidoPorMim: curtido, totalCurtidas: total }
                    : atual,
                )
              }
            />
          ) : (
            <LinhaAtividade
              item={item}
              onCurtidaMudou={(id, curtido, total) =>
                setItem((atual) =>
                  atual && atual.id === id
                    ? { ...atual, curtidoPorMim: curtido, totalCurtidas: total }
                    : atual,
                )
              }
            />
          )
        ) : null}

        {item && ehConteudo(item.tipo) ? (
          <section className={styles.comentariosPagina} aria-label="Comentários">
            {comentarios.cursor ? (
              <button
                type="button"
                className={styles.anteriores}
                onClick={() => void comentarios.carregarAnteriores()}
                disabled={comentarios.carregandoMais}
              >
                {comentarios.carregandoMais ? "Carregando…" : "Comentários anteriores"}
              </button>
            ) : null}
            {!comentarios.carregando && comentarios.itens.length === 0 ? (
              <p className={styles.folhaVazio}>Nenhum comentário ainda</p>
            ) : null}
            <ul>
              {[...comentarios.itens].reverse().map((c) => (
                <ItemComentario
                  key={c.id}
                  comentario={c}
                  onApagar={(id) => void comentarios.apagar(id)}
                  alvoDenuncia={
                    item.tipo === "foto" ? "comentario_post" : "comentario_atividade"
                  }
                />
              ))}
            </ul>
            <CampoComentario
              enviando={comentarios.enviando}
              erro={comentarios.erroEnvio}
              onEnviar={comentarios.enviar}
              autoFoco
            />
          </section>
        ) : null}
      </div>
    </div>
  );
};
