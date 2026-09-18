"use client";

import { useHistoricoPistas } from "../hooks/useHistoricoPistas";
import { ABAS_HISTORICO } from "../constants";
import { AbasHistorico } from "./AbasHistorico";
import { FiltroTipoHistoricoChips } from "./FiltroTipoHistorico";
import { ListaHistorico } from "./ListaHistorico";
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
  const listaAria =
    ABAS_HISTORICO.find((item) => item.id === historico.aba)?.listaAria ?? "";

  return (
    <section className={styles.secao} aria-labelledby="titulo-historico-pistas">
      <div className={perfil.secaoCabecalho}>
        <span className={perfil.secaoBarra} />
        <h2 id="titulo-historico-pistas" className={perfil.secaoTitulo}>
          Histórico de Pistas
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
        {!historico.carregando && !historico.erro ? (
          <ListaHistorico
            itens={historico.itensVisiveis}
            aba={historico.aba}
            ariaLabel={listaAria}
          />
        ) : null}
      </div>
    </section>
  );
};
