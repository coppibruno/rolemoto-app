"use client";

import { useApagarHistorico } from "../hooks/useApagarHistorico";
import { useHistoricoPistas } from "../hooks/useHistoricoPistas";
import { ABAS_HISTORICO } from "../constants";
import { AbasHistorico } from "./AbasHistorico";
import { FiltroTipoHistoricoChips } from "./FiltroTipoHistorico";
import { ListaHistorico } from "./ListaHistorico";
import { ListaHistoricoTelemetria } from "./ListaHistoricoTelemetria";
import { EstadoErroHistorico } from "./EstadoErroHistorico";
import perfil from "../perfil.module.css";
import styles from "../historico-pistas.module.css";

const SkeletonHistorico = () => (
  <div className={styles.lista} role="status" aria-label="Carregando histórico">
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonBloco} />
      <div className={styles.skeletonBarras}>
        <div className={styles.skeletonBarra} />
        <div className={`${styles.skeletonBarra} ${styles.skeletonBarraCurta}`} />
      </div>
    </div>
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonBloco} />
      <div className={styles.skeletonBarras}>
        <div className={styles.skeletonBarra} />
        <div className={`${styles.skeletonBarra} ${styles.skeletonBarraCurta}`} />
      </div>
    </div>
  </div>
);

export const HistoricoPistas = () => {
  const historico = useHistoricoPistas();
  const apagar = useApagarHistorico(historico.removerLocal);
  const listaAria =
    ABAS_HISTORICO.find((item) => item.id === historico.aba)?.listaAria ?? "";

  return (
    <section className={styles.secao} aria-labelledby="titulo-historico-pistas">
      <div className={perfil.secaoCabecalho}>
        <span className={`material-symbols-outlined ${perfil.secaoIcone}`} aria-hidden>
          history
        </span>
        <h2 id="titulo-historico-pistas" className={perfil.secaoTitulo}>
          Histórico
        </h2>
      </div>

      <AbasHistorico
        aba={historico.aba}
        onMudar={historico.setAba}
        contagens={historico.dados?.contagens ?? null}
        carregando={historico.carregando}
      />

      {historico.aba === "participei" && !historico.carregando && !historico.erro ? (
        <FiltroTipoHistoricoChips
          valor={historico.filtroTipo}
          onMudar={historico.setFiltroTipo}
        />
      ) : null}

      <div
        id="painel-historico"
        role="tabpanel"
        aria-labelledby={`tab-historico-${historico.aba}`}
      >
        {historico.erro ? (
          <EstadoErroHistorico
            mensagem={historico.erro}
            onTentarDeNovo={historico.recarregar}
          />
        ) : null}
        {historico.carregando ? <SkeletonHistorico /> : null}
        {apagar.feedback ? (
          <p className={styles.toastApagar} role="status">
            {apagar.feedback}
          </p>
        ) : null}
        {!historico.carregando && !historico.erro && historico.modoTelemetria ? (
          <ListaHistoricoTelemetria
            itens={historico.telemetrias}
            ocupadoId={apagar.ocupadoId}
            onApagar={(alvo) => void apagar.apagar(alvo)}
          />
        ) : null}
        {!historico.carregando && !historico.erro && !historico.modoTelemetria ? (
          <ListaHistorico
            itens={historico.itensVisiveis}
            aba={historico.aba}
            ariaLabel={listaAria}
            ocupadoId={apagar.ocupadoId}
            onApagar={(alvo) => void apagar.apagar(alvo)}
          />
        ) : null}
      </div>
    </section>
  );
};
