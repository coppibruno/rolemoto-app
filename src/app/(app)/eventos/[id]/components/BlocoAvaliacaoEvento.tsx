import Link from "next/link";
import { SeloMediaAvaliacoes } from "@/app/(app)/feed/components/SeloMediaAvaliacoes";
import { eventoEncerrado } from "@/lib/countdown-evento";
import type { EventoDetalhe } from "@/types/evento";
import { TITULO_AVALIACOES } from "../constants";
import styles from "../evento-detalhe.module.css";

type Props = {
  evento: EventoDetalhe;
};

export const BlocoAvaliacaoEvento = ({ evento }: Props) => {
  const encerrado = eventoEncerrado(
    evento.dataHoraAbertura,
    evento.dataHoraEncerramento,
  );
  const mostrarAvaliar = evento.inscrito && encerrado && evento.avaliado !== true;
  const mostrarVer = evento.avaliado === true;
  const temMedia = (evento.totalAvaliacoes ?? 0) > 0;
  const temComboio = (evento.recomendacoesComboio ?? 0) > 0;

  if (!temMedia && !mostrarAvaliar && !mostrarVer) return null;

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitulo}>{TITULO_AVALIACOES}</h3>
      {temMedia ? (
        <SeloMediaAvaliacoes
          notaMedia={evento.notaMedia ?? 0}
          totalAvaliacoes={evento.totalAvaliacoes ?? 0}
        />
      ) : null}
      {temComboio ? (
        <p className={styles.texto}>
          {evento.recomendacoesComboio}{" "}
          {evento.recomendacoesComboio === 1
            ? "piloto recomenda comboio"
            : "pilotos recomendam comboio"}
        </p>
      ) : null}
      {mostrarAvaliar || mostrarVer ? (
        <Link href={`/eventos/${evento.id}/avaliar`} className={styles.linkAvaliacao}>
          {mostrarVer ? "Ver avaliação" : "Avaliar experiência"}
        </Link>
      ) : null}
    </section>
  );
};
