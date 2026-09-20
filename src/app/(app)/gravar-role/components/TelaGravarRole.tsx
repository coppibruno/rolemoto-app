"use client";

import { CabecalhoTelemetria } from "@/components/telemetria/CabecalhoTelemetria";
import styles from "@/components/telemetria/telemetria.module.css";
import { useGravarRole } from "../hooks/useGravarRole";
import { BotaoControleGravacao } from "./BotaoControleGravacao";
import { PainelGravacaoAtiva } from "./PainelGravacaoAtiva";
import { ResumoPreSave } from "./ResumoPreSave";
import { StatusGravacao } from "./StatusGravacao";

export const TelaGravarRole = () => {
  const g = useGravarRole();

  return (
    <div className={styles.tela}>
      <CabecalhoTelemetria titulo="Gravar rolê" hrefVoltar="/" />
      <div className={styles.conteudo}>
        {g.fase === "carregando" ? (
          <p className={styles.statusHint}>Preparando GPS…</p>
        ) : null}

        {g.fase === "web" ? (
          <section className={`${styles.card} ${styles.cardCockpit}`}>
            <StatusGravacao
              label="GPS pronto só no app"
              hint="Telemetria com tela desligada só no app Rolemoto (Android/iOS)."
            />
            <BotaoControleGravacao
              label="Iniciar gravação"
              icone="play_circle"
              disabled
              onClick={() => undefined}
            />
            <p className={styles.copyWeb}>
              Telemetria com tela desligada só no app Rolemoto (Android/iOS).
            </p>
          </section>
        ) : null}

        {g.fase === "idle" ? (
          <section className={`${styles.card} ${styles.cardCockpit}`}>
            <StatusGravacao
              label="GPS pronto"
              hint="Permita localização sempre para medir com a tela off."
            />
            <BotaoControleGravacao
              label="Iniciar gravação"
              icone="play_circle"
              disabled={g.ocupado}
              onClick={() => void g.iniciar()}
            />
          </section>
        ) : null}

        {g.fase === "gravando" && g.iniciadoEm ? (
          <PainelGravacaoAtiva
            iniciadoEm={g.iniciadoEm}
            ocupado={g.ocupado}
            onEncerrar={() => void g.finalizar()}
          />
        ) : null}

        {g.fase === "resumo" && g.resumo ? (
          <ResumoPreSave
            dados={g.resumo}
            titulo={g.titulo}
            ocupado={g.ocupado}
            onTitulo={g.setTitulo}
            onSalvar={() => void g.salvar()}
            onDescartar={() => void g.descartar()}
          />
        ) : null}

        {g.erro ? (
          <div>
            <p className={styles.erro} role="alert">
              {g.erro}
            </p>
            {g.erro.includes("sempre") ? (
              <button
                type="button"
                className={styles.ctaSecundario}
                onClick={() => void g.abrirAjustes()}
              >
                Abrir ajustes
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
