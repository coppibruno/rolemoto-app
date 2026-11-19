"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CampoComentario } from "@/components/comentarios/CampoComentario";
import { ItemComentario } from "@/components/comentarios/ItemComentario";
import type { ItemAtividade } from "@/types/atividade";
import { useCamadaCheia } from "@/app/(app)/stories/camada-cheia";
import { useComentariosAtividade } from "../hooks/useComentariosAtividade";
import styles from "../inicio.module.css";

type Props = {
  item: ItemAtividade;
  onFechar: () => void;
  onTotalMudou: (id: string, delta: number) => void;
};

export const FolhaComentarios = ({ item, onFechar, onTotalMudou }: Props) => {
  useCamadaCheia(true);
  const [montado, setMontado] = useState(false);
  const comentarios = useComentariosAtividade(item.id, (delta) =>
    onTotalMudou(item.id, delta),
  );

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [onFechar]);

  if (!montado) return null;

  return createPortal(
    <>
      <button
        type="button"
        className={styles.folhaFundo}
        aria-label="Fechar comentários"
        onClick={onFechar}
      />
      <div className={styles.folha} role="dialog" aria-modal="true" aria-label="Comentários">
        <button
          type="button"
          className={styles.alca}
          aria-label="Fechar"
          onClick={onFechar}
        />
        <h2 className={styles.folhaTitulo}>Comentários</h2>
        {comentarios.cursor ? (
          <button
            type="button"
            className={styles.anteriores}
            style={{ marginLeft: "var(--gutter-md)" }}
            onClick={() => void comentarios.carregarAnteriores()}
            disabled={comentarios.carregandoMais}
          >
            {comentarios.carregandoMais ? "Carregando…" : "Comentários anteriores"}
          </button>
        ) : null}
        {comentarios.carregando ? (
          <p className={styles.folhaVazio}>Carregando…</p>
        ) : null}
        {!comentarios.carregando && comentarios.itens.length === 0 ? (
          <p className={styles.folhaVazio}>Nenhum comentário ainda</p>
        ) : null}
        <ul className={styles.folhaLista}>
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
          autoFoco={comentarios.itens.length === 0 && !comentarios.carregando}
        />
      </div>
    </>,
    document.body,
  );
};
