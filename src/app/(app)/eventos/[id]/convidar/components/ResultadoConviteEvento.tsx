"use client";

import { BotaoInscreverEvento } from "@/app/(app)/feed/components/BotaoInscreverEvento";
import type { ResultadoConvite } from "@/types/convite-evento";
import type { EventoDetalhe } from "@/types/evento";
import styles from "../convidar.module.css";

type Props = {
  resultado: ResultadoConvite;
  evento: EventoDetalhe;
};

export const ResultadoConviteEvento = ({ resultado, evento }: Props) => {
  const enviados = resultado.enviados.length;
  const jaInscritos = resultado.jaInscritos.length;
  const jaConvidados = resultado.jaConvidados.length;

  return (
    <section className={styles.resultado}>
      <h2>{enviados > 0 ? "Convites enviados" : "Nenhum convite novo"}</h2>
      {enviados > 0 ? (
        <p>{enviados === 1 ? "1 piloto chamado" : `${enviados} pilotos chamados`}</p>
      ) : null}
      {jaInscritos > 0 ? <p>{jaInscritos} já estavam no evento</p> : null}
      {jaConvidados > 0 ? <p>{jaConvidados} já tinham convite seu</p> : null}
      {!evento.inscrito ? (
        <BotaoInscreverEvento
          id={evento.id}
          acesso={evento.acesso}
          linkIngresso={evento.linkIngresso}
          inscrito={false}
          podeConvidar={false}
        />
      ) : null}
    </section>
  );
};
