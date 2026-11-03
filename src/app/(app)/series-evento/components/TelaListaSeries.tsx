"use client";

import { useState } from "react";
import Link from "next/link";
import { formatarPeriodoEvento } from "@/app/(app)/feed/formatar-horario";
import type { SerieEventoResumo } from "@/types/serie-evento";
import { GuardaAdmin } from "./GuardaAdmin";
import { ModalEncerrarSerie } from "./ModalEncerrarSerie";
import { useListaSeries } from "../hooks/useListaSeries";
import styles from "../series-evento.module.css";

const STATUS: Record<SerieEventoResumo["status"], string> = {
  ativa: "Ativa",
  pausada: "Pausada",
  encerrada: "Encerrada",
};

const LinhaSerie = ({
  item,
  ocupado,
  onPausar,
  onEncerrar,
}: {
  item: SerieEventoResumo;
  ocupado: boolean;
  onPausar: () => void;
  onEncerrar: () => void;
}) => {
  const quando = item.proxima
    ? formatarPeriodoEvento(
        item.proxima.dataHoraAbertura,
        item.proxima.dataHoraEncerramento,
      )
    : "Sem data no horizonte";

  return (
    <li className={styles.cartao}>
      <Link href={`/series-evento/${item.id}`} className={styles.cartaoTopo}>
        <span className={styles.rotulo}>{item.rotulo}</span>
        <h2 className={styles.nome}>{item.titulo}</h2>
        <p className={styles.meta}>
          {STATUS[item.status]} · {item.horaAbertura}–{item.horaEncerramento} · {quando}
        </p>
      </Link>
      {item.status === "encerrada" ? null : (
        <div className={styles.acoes}>
          <button type="button" className={styles.botao} onClick={onPausar} disabled={ocupado}>
            {item.status === "pausada" ? "Retomar" : "Pausar"}
          </button>
          <button
            type="button"
            className={styles.botaoAlerta}
            onClick={onEncerrar}
            disabled={ocupado}
          >
            Encerrar
          </button>
        </div>
      )}
    </li>
  );
};

export const TelaListaSeries = () => {
  const lista = useListaSeries();
  const [encerrarId, setEncerrarId] = useState<string | null>(null);
  const alvo = lista.itens.find((item) => item.id === encerrarId) ?? null;

  return (
    <GuardaAdmin>
      <div className={styles.tela}>
        <header className={styles.cabecalho}>
          <Link href="/criar-evento" className={styles.voltar} aria-label="Voltar ao cadastro">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className={styles.titulo}>Encontros semanais</h1>
        </header>
        {lista.carregando ? <p className={styles.apoio}>Carregando...</p> : null}
        {lista.erro ? (
          <p className={styles.erro} role="alert">
            {lista.erro}
          </p>
        ) : null}
        {!lista.carregando && lista.itens.length === 0 ? (
          <p className={styles.vazio}>Nenhum encontro semanal ainda.</p>
        ) : null}
        {lista.itens.length > 0 ? (
          <ul className={styles.lista}>
            {lista.itens.map((item) => (
              <LinhaSerie
                key={item.id}
                item={item}
                ocupado={lista.ocupadoId === item.id}
                onPausar={() => lista.alternarPausa(item)}
                onEncerrar={() => setEncerrarId(item.id)}
              />
            ))}
          </ul>
        ) : null}
        {alvo ? (
          <ModalEncerrarSerie
            titulo={alvo.titulo}
            enviando={lista.ocupadoId === alvo.id}
            onFechar={() => setEncerrarId(null)}
            onConfirmar={() => {
              void lista.encerrar(alvo.id).then((ok) => {
                if (ok) setEncerrarId(null);
              });
            }}
          />
        ) : null}
      </div>
    </GuardaAdmin>
  );
};
