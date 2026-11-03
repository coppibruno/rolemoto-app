"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { EventoDetalhe } from "@/types/evento";
import { montarIsoEncerramento, montarIsoEvento } from "@/app/(app)/criar-evento/montar-iso-evento";
import { eventoDetalheService } from "../services/evento-detalhe.service";
import styles from "../evento-detalhe.module.css";

const TZ = "America/Sao_Paulo";

const ymdDe = (iso: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));

const horaDe = (iso: string): string => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const ler = (tipo: string) => parts.find((parte) => parte.type === tipo)?.value ?? "00";
  const hora = ler("hour") === "24" ? "00" : ler("hour");
  return `${hora}:${ler("minute")}`;
};

const diaSeguinte = (ymd: string): string => {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + 1));
  const pad = (valor: number) => String(valor).padStart(2, "0");
  return `${data.getUTCFullYear()}-${pad(data.getUTCMonth() + 1)}-${pad(data.getUTCDate())}`;
};

type Props = {
  evento: EventoDetalhe;
  onSalvo: () => void;
};

export const BlocoAdminSerie = ({ evento, onSalvo }: Props) => {
  const { usuario } = useAuth();
  const [titulo, setTitulo] = useState(evento.titulo);
  const [informacoes, setInformacoes] = useState(evento.informacoes);
  const [data, setData] = useState(evento.ocorrenciaYmd ?? ymdDe(evento.dataHoraAbertura));
  const [abertura, setAbertura] = useState(horaDe(evento.dataHoraAbertura));
  const [encerramento, setEncerramento] = useState(
    evento.dataHoraEncerramento ? horaDe(evento.dataHoraEncerramento) : "",
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  if (usuario?.admin !== true || !evento.serieId) {
    return null;
  }

  const fim = evento.dataHoraEncerramento ?? evento.dataHoraAbertura;
  const podeAjustar = !evento.cancelada && Date.parse(fim) > Date.now();

  const salvar = async () => {
    if (!encerramento) {
      setErro("Informe o horário de encerramento");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const dataFim = encerramento <= abertura ? diaSeguinte(data) : data;
      await eventoDetalheService.ajustar(evento.id, {
        titulo: titulo.trim(),
        informacoes: informacoes.trim(),
        dataHoraAbertura: montarIsoEvento(data, abertura),
        dataHoraEncerramento: montarIsoEncerramento(dataFim, encerramento),
      });
      onSalvo();
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : "Não foi possível ajustar");
      setSalvando(false);
    }
  };

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitulo}>Só esta data</h3>
      <p className={styles.texto}>
        A outra semana continua no horário do encontro. Aqui muda só esta ocorrência.
      </p>
      {podeAjustar ? (
        <>
          <label className={styles.texto} htmlFor="ajuste-titulo">
            Nome
          </label>
          <input
            id="ajuste-titulo"
            className={styles.inputAjuste}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={salvando}
          />
          <label className={styles.texto} htmlFor="ajuste-data">
            Data
          </label>
          <input
            id="ajuste-data"
            type="date"
            className={styles.inputAjuste}
            value={data}
            onChange={(e) => setData(e.target.value)}
            disabled={salvando}
          />
          <div className={styles.badgesLinha}>
            <input
              aria-label="Hora de abertura"
              type="time"
              className={styles.inputAjuste}
              value={abertura}
              onChange={(e) => setAbertura(e.target.value)}
              disabled={salvando}
            />
            <input
              aria-label="Hora de encerramento"
              type="time"
              className={styles.inputAjuste}
              value={encerramento}
              onChange={(e) => setEncerramento(e.target.value)}
              disabled={salvando}
            />
          </div>
          <label className={styles.texto} htmlFor="ajuste-recados">
            Recados
          </label>
          <textarea
            id="ajuste-recados"
            className={styles.inputAjuste}
            value={informacoes}
            onChange={(e) => setInformacoes(e.target.value)}
            disabled={salvando}
          />
          {erro ? (
            <p className={styles.textoErro} role="alert">
              {erro}
            </p>
          ) : null}
          <button type="button" className={styles.ctaExterno} onClick={() => void salvar()} disabled={salvando}>
            Ajustar só esta data
          </button>
        </>
      ) : null}
      <Link href={`/series-evento/${evento.serieId}`} className={styles.linkAvaliacao}>
        Ver o encontro semanal
      </Link>
    </section>
  );
};
