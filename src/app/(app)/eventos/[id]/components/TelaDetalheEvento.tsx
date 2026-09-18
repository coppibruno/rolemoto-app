"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import type { EventoDetalhe } from "@/types/evento";
import { BotaoInscreverEvento } from "@/app/(app)/feed/components/BotaoInscreverEvento";
import { SeloMediaAvaliacoes } from "@/app/(app)/feed/components/SeloMediaAvaliacoes";
import { BlocoParticipantes } from "@/components/participantes/BlocoParticipantes";
import { LABELS_ACESSO_EVENTO } from "@/app/(app)/feed/constants";
import { formatarHorarioEvento } from "@/app/(app)/feed/formatar-horario";
import { eventoDetalheService } from "../services/evento-detalhe.service";
import styles from "../evento-detalhe.module.css";

type Props = {
  id: string;
};

const eventoEncerrou = (evento: EventoDetalhe): boolean => {
  const limite = evento.dataHoraEncerramento ?? evento.dataHoraAbertura;
  return Date.parse(limite) <= Date.now();
};

export const TelaDetalheEvento = ({ id }: Props) => {
  const [evento, setEvento] = useState<EventoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    eventoDetalheService
      .buscar(id)
      .then((dados) => {
        if (!cancelado) setEvento(dados);
      })
      .catch((e) => {
        if (cancelado) return;
        setEvento(null);
        setErro(
          e instanceof ApiError ? e.message : "Não foi possível carregar o evento",
        );
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  if (carregando) {
    return (
      <main className={styles.tela} aria-busy="true">
        <div className={styles.card}>
          <p className={styles.texto}>Carregando evento…</p>
        </div>
      </main>
    );
  }

  if (erro || !evento) {
    return (
      <main className={styles.tela}>
        <div className={styles.card}>
          <span className={`material-symbols-outlined ${styles.icone}`} aria-hidden>
            cloud_off
          </span>
          <h1 className={styles.titulo}>Evento indisponível</h1>
          <p className={styles.texto}>{erro ?? "Evento não encontrado"}</p>
          <Link href="/" className={styles.link}>
            Voltar ao Feed
          </Link>
        </div>
      </main>
    );
  }

  const local =
    evento.local.nome.trim() || evento.local.endereco.trim() || "Local";
  const encerrado = eventoEncerrou(evento);
  const mostrarAvaliar =
    evento.inscrito && encerrado && evento.avaliado !== true;
  const mostrarVerAvaliacao = evento.avaliado === true;

  return (
    <main className={styles.tela}>
      <article className={styles.detalhe}>
        {evento.fotoCapaUrl ? (
          <img
            src={evento.fotoCapaUrl}
            alt=""
            className={styles.capa}
          />
        ) : (
          <div className={styles.capaVazia} aria-hidden>
            <span className="material-symbols-outlined">local_activity</span>
          </div>
        )}

        <div className={styles.corpo}>
          <div className={styles.badges}>
            <span className={styles.badge}>
              {formatarHorarioEvento(evento.dataHoraAbertura)}
            </span>
            <span className={styles.badge}>
              {LABELS_ACESSO_EVENTO[evento.acesso]}
            </span>
            {(evento.totalAvaliacoes ?? 0) > 0 ? (
              <span className={styles.badge}>
                <SeloMediaAvaliacoes
                  notaMedia={evento.notaMedia ?? 0}
                  totalAvaliacoes={evento.totalAvaliacoes ?? 0}
                />
              </span>
            ) : null}
          </div>

          <h1 className={styles.tituloDetalhe}>{evento.titulo}</h1>

          <p className={styles.meta}>
            <span className="material-symbols-outlined" aria-hidden>
              location_on
            </span>
            {local}
          </p>

          {evento.participantes?.total > 0 ? (
            <BlocoParticipantes
              tipo="evento"
              id={evento.id}
              participantes={evento.participantes}
            />
          ) : null}

          {evento.informacoes.trim() ? (
            <p className={styles.informacoes}>{evento.informacoes}</p>
          ) : null}

          <BotaoInscreverEvento
            id={evento.id}
            acesso={evento.acesso}
            linkIngresso={evento.linkIngresso}
            inscrito={evento.inscrito}
          />

          {mostrarAvaliar || mostrarVerAvaliacao ? (
            <Link href={`/eventos/${evento.id}/avaliar`} className={styles.link}>
              {mostrarVerAvaliacao ? "Ver avaliação" : "Avaliar experiência"}
            </Link>
          ) : null}

          <Link href="/" className={styles.linkSecundario}>
            Voltar ao Feed
          </Link>
        </div>
      </article>
    </main>
  );
};
