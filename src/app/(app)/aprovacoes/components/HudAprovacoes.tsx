"use client";

import type { ResumoAprovacoes } from "@/types/aprovacao";
import { HUD_BADGE, HUD_TITULO, rotuloPilotos, rotuloRoles } from "../constants";
import styles from "../aprovacoes.module.css";

type Props = {
  resumo: ResumoAprovacoes;
};

export const HudAprovacoes = ({ resumo }: Props) => {
  const subtitulo =
    resumo.pendentes > 0 ? (
      <>
        <span className={styles.hudDestaque}>
          {rotuloPilotos(resumo.pendentes)}
        </span>{" "}
        na fila de triagem aguardando seu aval em{" "}
        {rotuloRoles(resumo.rolesComPendentes)}{" "}
        {resumo.rolesComPendentes === 1 ? "ativo" : "ativos"}.
      </>
    ) : (
      <>
        Nenhum pedido na fila.{" "}
        <span className={styles.hudDestaque}>
          {rotuloPilotos(resumo.aceitos)}
        </span>{" "}
        já confirmado{resumo.aceitos === 1 ? "" : "s"} na grade.
      </>
    );

  return (
    <section className={styles.hud}>
      <div className={styles.hudTopo}>
        <div className={styles.hudTituloLinha}>
          <span className={styles.pulso} aria-hidden />
          <h1 className={styles.hudTitulo}>{HUD_TITULO}</h1>
        </div>
        <span className={styles.hudBadge}>{HUD_BADGE}</span>
      </div>
      <p className={styles.hudSubtitulo}>{subtitulo}</p>
    </section>
  );
};
