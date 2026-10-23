"use client";

import { CarrosselStories } from "@/app/(app)/stories/components/CarrosselStories";
import { useAbaFeed } from "../hooks/useAbaFeed";
import { useContagensFeed } from "../hooks/useContagensFeed";
import { useFeedbackPendente } from "../hooks/useFeedbackPendente";
import { useFiltrosFeed } from "../hooks/useFiltrosFeed";
import { useListaEventos } from "../hooks/useListaEventos";
import { useListaLocais } from "../hooks/useListaLocais";
import { useListaRoles } from "../hooks/useListaRoles";
import { useLocalizacaoFeed } from "../hooks/useLocalizacaoFeed";
import { useResumoAprovacoes } from "../hooks/useResumoAprovacoes";
import { AbasFeed } from "./AbasFeed";
import { BannerCockpitLider } from "./BannerCockpitLider";
import { BarraBuscaRaio } from "./BarraBuscaRaio";
import { CabecalhoFeed } from "./CabecalhoFeed";
import { CardFeedbackPendente } from "./CardFeedbackPendente";
import { FiltrosData } from "./FiltrosData";
import { FiltrosRitmo } from "./FiltrosRitmo";
import { ListaEventos } from "./ListaEventos";
import { ListaLocais } from "./ListaLocais";
import { ListaRoles } from "./ListaRoles";
import { PainelLocalizacao } from "./PainelLocalizacao";
import { SeletorLocalizacao } from "./SeletorLocalizacao";
import styles from "../feed.module.css";

export const TelaFeed = () => {
  const localizacao = useLocalizacaoFeed();
  const filtros = useFiltrosFeed();
  const { aba, setAba } = useAbaFeed();
  const resumoAprovacoes = useResumoAprovacoes();
  const feedbackPendente = useFeedbackPendente();

  const filtrosBase = {
    ponto: localizacao.ponto,
    raioKm: filtros.raioKm,
    quando: filtros.quando,
    ritmo: filtros.ritmo,
    busca: filtros.buscaDebounced,
  };

  const contagens = useContagensFeed(filtrosBase);

  const listaRoles = useListaRoles({
    ...filtrosBase,
    ativo: aba === "roles",
  });
  const listaEventos = useListaEventos({
    ponto: localizacao.ponto,
    raioKm: filtros.raioKm,
    quando: filtros.quando,
    busca: filtros.buscaDebounced,
    ativo: aba === "eventos",
  });
  const listaLocais = useListaLocais({
    ponto: localizacao.ponto,
    raioKm: filtros.raioKm,
    busca: filtros.buscaDebounced,
    ativo: aba === "locais",
  });

  const semPonto = !localizacao.ponto;
  const mostrarQuando = aba === "roles" || aba === "eventos";
  const mostrarRitmo = aba === "roles";

  return (
    <div className={styles.tela}>
      <CabecalhoFeed />
      <div className={styles.corpo}>
        {feedbackPendente.role ? (
          <CardFeedbackPendente
            role={feedbackPendente.role}
            onDispensar={feedbackPendente.dispensar}
          />
        ) : null}

        {resumoAprovacoes ? (
          <BannerCockpitLider resumo={resumoAprovacoes} />
        ) : null}

        <PainelLocalizacao
          ponto={localizacao.ponto}
          status={localizacao.status}
          onAlterar={localizacao.abrirSeletor}
        />

        <BarraBuscaRaio
          busca={filtros.busca}
          onBusca={filtros.setBusca}
          raioKm={filtros.raioKm}
          onCiclarRaio={filtros.ciclarRaio}
        />

        <AbasFeed
          aba={aba}
          onChange={setAba}
          contagens={contagens.contagens}
          carregando={contagens.carregando}
        />

        {mostrarQuando || mostrarRitmo ? (
          <section id="filtros-feed" className={styles.chips} aria-label="Filtros">
            {mostrarQuando ? (
              <FiltrosData
                valor={filtros.quando}
                onAlternar={filtros.alternarQuando}
                onEscolherData={filtros.escolherData}
                onLimparData={filtros.limparData}
              />
            ) : null}
            {mostrarQuando && mostrarRitmo ? (
              <span className={styles.chipsDivisor} aria-hidden />
            ) : null}
            {mostrarRitmo ? (
              <FiltrosRitmo valor={filtros.ritmo} onChange={filtros.setRitmo} />
            ) : null}
          </section>
        ) : (
          <div id="filtros-feed" className={styles.filtrosAncora} />
        )}

        {aba === "roles" ? <CarrosselStories /> : null}

        {aba === "roles" ? (
          <ListaRoles
            itens={listaRoles.itens}
            carregando={listaRoles.carregando}
            erro={listaRoles.erro}
            semPonto={semPonto}
            onTentarDeNovo={listaRoles.recarregar}
          />
        ) : null}

        {aba === "eventos" ? (
          <ListaEventos
            itens={listaEventos.itens}
            carregando={listaEventos.carregando}
            erro={listaEventos.erro}
            semPonto={semPonto}
            ponto={localizacao.ponto}
            raioKm={filtros.raioKm}
            onTentarDeNovo={listaEventos.recarregar}
          />
        ) : null}

        {aba === "locais" ? (
          <ListaLocais
            itens={listaLocais.itens}
            carregando={listaLocais.carregando}
            erro={listaLocais.erro}
            semPonto={semPonto}
            ponto={localizacao.ponto}
            raioKm={filtros.raioKm}
            onTentarDeNovo={listaLocais.recarregar}
          />
        ) : null}
      </div>

      {localizacao.seletorAberto ? (
        <SeletorLocalizacao
          onFechar={localizacao.fecharSeletor}
          onUsarGps={localizacao.usarGps}
          onEscolher={localizacao.escolherEndereco}
        />
      ) : null}
    </div>
  );
};
