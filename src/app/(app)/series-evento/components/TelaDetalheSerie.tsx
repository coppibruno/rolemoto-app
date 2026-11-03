"use client";

import { useState } from "react";
import Link from "next/link";
import { formatarPeriodoEvento } from "@/app/(app)/feed/formatar-horario";
import { pluralDiaSemana, rotuloDiaSemana } from "@/lib/rotulo-dia-semana";
import type { OcorrenciaSerie, SerieEvento } from "@/types/serie-evento";
import { GuardaAdmin } from "./GuardaAdmin";
import { ModalEncerrarSerie } from "./ModalEncerrarSerie";
import { useSerieEvento } from "../hooks/useSerieEvento";
import styles from "../series-evento.module.css";

const STATUS: Record<SerieEvento["status"], string> = {
  ativa: "Ativa",
  pausada: "Pausada",
  encerrada: "Encerrada",
};

const LinhaOcorrencia = ({ item }: { item: OcorrenciaSerie }) => (
  <li className={styles.ocorrencia}>
    <Link href={`/eventos/${item.id}`} className={styles.nome}>
      {formatarPeriodoEvento(item.dataHoraAbertura, item.dataHoraEncerramento)}
    </Link>
    <p className={item.cancelada ? styles.cancelada : styles.meta}>
      {item.cancelada ? "Cancelada" : "No ar"}
      {item.ocorrenciaAjustada ? " · horário desta data" : ""}
      {" · "}
      {item.inscritos} {item.inscritos === 1 ? "inscrito" : "inscritos"}
    </p>
  </li>
);

const FormPular = ({
  padrao,
  ocupado,
  onPular,
}: {
  padrao: string;
  ocupado: boolean;
  onPular: (ymd: string) => void;
}) => {
  const [ymd, setYmd] = useState(padrao);

  return (
    <form
      className={styles.campo}
      onSubmit={(evento) => {
        evento.preventDefault();
        if (ymd) onPular(ymd);
      }}
    >
      <label htmlFor="pular-ymd" className={styles.meta}>
        Pular esta data
      </label>
      <input
        id="pular-ymd"
        type="date"
        className={styles.input}
        value={ymd}
        onChange={(evento) => setYmd(evento.target.value)}
        disabled={ocupado}
      />
      <button type="submit" className={styles.botao} disabled={ocupado || !ymd}>
        Pular esta data
      </button>
    </form>
  );
};

export const TelaDetalheSerie = ({ id }: { id: string }) => {
  const serie = useSerieEvento(id);
  const [confirmar, setConfirmar] = useState(false);
  const dados = serie.detalhe;
  const padrao =
    dados?.ocorrencias.find((item) => !item.cancelada)?.ocorrenciaYmd ?? "";

  return (
    <GuardaAdmin>
      <div className={styles.tela}>
        <header className={styles.cabecalho}>
          <Link href="/series-evento" className={styles.voltar} aria-label="Voltar à lista">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className={styles.titulo}>{dados?.serie.titulo ?? "Encontro"}</h1>
        </header>
        {serie.carregando ? <p className={styles.apoio}>Carregando...</p> : null}
        {serie.erro ? (
          <p className={styles.erro} role="alert">
            {serie.erro}
          </p>
        ) : null}
        {dados ? (
          <>
            <p className={styles.rotulo}>{rotuloDiaSemana(dados.serie.diaSemana)}</p>
            <p className={styles.meta}>
              {STATUS[dados.serie.status]} · {dados.serie.horaAbertura}–
              {dados.serie.horaEncerramento}
            </p>
            <p className={styles.apoio}>
              Vale para as próximas {pluralDiaSemana(dados.serie.diaSemana)} em que
              ninguém se inscreveu.
            </p>
            <ul className={styles.lista}>
              {dados.ocorrencias.map((item) => (
                <LinhaOcorrencia key={item.id} item={item} />
              ))}
            </ul>
            {dados.serie.status === "encerrada" ? null : (
              <div className={styles.bloco}>
                <FormPular
                  key={padrao}
                  padrao={padrao}
                  ocupado={serie.ocupado}
                  onPular={(ymd) => void serie.pular(ymd)}
                />
                <div className={styles.acoes}>
                <Link href={`/series-evento/${id}/editar`} className={styles.botao}>
                  Editar o rito
                </Link>
                {dados.serie.status === "pausada" ? (
                  <button type="button" className={styles.botao} onClick={() => void serie.pausar()}>
                    Retomar
                  </button>
                ) : (
                  <button type="button" className={styles.botao} onClick={() => void serie.pausar()}>
                    Pausar
                  </button>
                )}
                <button
                  type="button"
                  className={styles.botaoAlerta}
                  onClick={() => setConfirmar(true)}
                >
                  Encerrar encontro
                </button>
                </div>
              </div>
            )}
          </>
        ) : null}
        {confirmar && dados ? (
          <ModalEncerrarSerie
            titulo={dados.serie.titulo}
            enviando={serie.ocupado}
            onFechar={() => setConfirmar(false)}
            onConfirmar={() => {
              void serie.encerrar().then((ok) => {
                if (ok) setConfirmar(false);
              });
            }}
          />
        ) : null}
      </div>
    </GuardaAdmin>
  );
};
