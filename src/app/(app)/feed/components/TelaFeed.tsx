"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEstadoRetorno } from "@/hooks/useEstadoRetorno";
import { useAbaFeed } from "../hooks/useAbaFeed";
import { useContagensFeed } from "../hooks/useContagensFeed";
import { lerEstadoFeed, useFiltrosFeed } from "../hooks/useFiltrosFeed";
import { useListaEventos } from "../hooks/useListaEventos";
import { useListaLocais } from "../hooks/useListaLocais";
import { useListaRoles } from "../hooks/useListaRoles";
import { useLocalizacaoFeed } from "../hooks/useLocalizacaoFeed";
import { AbasFeed } from "./AbasFeed";
import { LinkSugestoesEventos } from "./LinkSugestoesEventos";
import { BarraBuscaRaio } from "./BarraBuscaRaio";
import { CabecalhoFeed } from "./CabecalhoFeed";
import { FiltrosData } from "./FiltrosData";
import { FiltrosRitmo } from "./FiltrosRitmo";
import { ListaEventos } from "./ListaEventos";
import { ListaLocais } from "./ListaLocais";
import { ListaRoles } from "./ListaRoles";
import { PainelLocalizacao } from "./PainelLocalizacao";
import { SeletorLocalizacao } from "./SeletorLocalizacao";
import styles from "../feed.module.css";

export const TelaFeed = () => {
  const { usuario } = useAuth();
  const localizacao = useLocalizacaoFeed();
  const filtros = useFiltrosFeed();
  const { aba, setAba } = useAbaFeed();
  const retornoPronto = useEstadoRetorno(
    "feed",
    {
      aba,
      raioKm: filtros.raioKm,
      quando: filtros.quando,
      ritmo: filtros.ritmo,
      busca: filtros.busca,
    },
    (salvo) => {
      const valido = lerEstadoFeed(salvo);
      if (!valido) return;
      setAba(valido.aba);
      filtros.restaurar(valido);
    },
  );

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
    ativo: retornoPronto && aba === "roles",
  });
  const listaEventos = useListaEventos({
    ponto: localizacao.ponto,
    raioKm: filtros.raioKm,
    quando: filtros.quando,
    busca: filtros.buscaDebounced,
    ativo: retornoPronto && aba === "eventos",
  });
  const listaLocais = useListaLocais({
    ponto: localizacao.ponto,
    raioKm: filtros.raioKm,
    busca: filtros.buscaDebounced,
    ativo: retornoPronto && aba === "locais",
  });

  const semPonto = !localizacao.ponto;
  const mostrarQuando = aba === "roles" || aba === "eventos";
  const mostrarRitmo = aba === "roles";

  return (
    <div className={styles.tela}>
      <CabecalhoFeed />
      <div className={styles.corpo}>
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

        {aba === "roles" ? (
          <ListaRoles
            itens={listaRoles.itens}
            carregando={listaRoles.carregando}
            erro={listaRoles.erro}
            semPonto={semPonto}
            onTentarDeNovo={listaRoles.recarregar}
          />
        ) : null}

        {aba === "eventos" && usuario?.admin ? <LinkSugestoesEventos /> : null}

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
