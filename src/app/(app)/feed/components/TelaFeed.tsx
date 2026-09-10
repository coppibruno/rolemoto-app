"use client";

import { useFiltrosFeed } from "../hooks/useFiltrosFeed";
import { useListaRoles } from "../hooks/useListaRoles";
import { useLocalizacaoFeed } from "../hooks/useLocalizacaoFeed";
import { useResumoAprovacoes } from "../hooks/useResumoAprovacoes";
import { CabecalhoFeed } from "./CabecalhoFeed";
import { BannerCockpitLider } from "./BannerCockpitLider";
import { CampoBusca } from "./CampoBusca";
import { FiltrosData } from "./FiltrosData";
import { FiltrosRaio } from "./FiltrosRaio";
import { FiltrosRitmo } from "./FiltrosRitmo";
import { ListaRoles } from "./ListaRoles";
import { PainelLocalizacao } from "./PainelLocalizacao";
import { SeletorLocalizacao } from "./SeletorLocalizacao";
import styles from "../feed.module.css";

export const TelaFeed = () => {
  const localizacao = useLocalizacaoFeed();
  const filtros = useFiltrosFeed();
  const resumoAprovacoes = useResumoAprovacoes();
  const lista = useListaRoles({
    ponto: localizacao.ponto,
    raioKm: filtros.raioKm,
    quando: filtros.quando,
    ritmo: filtros.ritmo,
    busca: filtros.buscaDebounced,
  });

  return (
    <div className={styles.tela}>
      <CabecalhoFeed />
      <div className={styles.corpo}>
        {resumoAprovacoes ? (
          <BannerCockpitLider resumo={resumoAprovacoes} />
        ) : null}
        <PainelLocalizacao
          ponto={localizacao.ponto}
          status={localizacao.status}
          onAlterar={localizacao.abrirSeletor}
        >
          <CampoBusca valor={filtros.busca} onChange={filtros.setBusca} />
        </PainelLocalizacao>

        <section id="filtros-feed" className={styles.filtros}>
          <FiltrosRaio valor={filtros.raioKm} onChange={filtros.setRaioKm} />
          <FiltrosData
            valor={filtros.quando}
            onAlternar={filtros.alternarQuando}
            onEscolherData={filtros.escolherData}
            onLimparData={filtros.limparData}
          />
          <FiltrosRitmo valor={filtros.ritmo} onChange={filtros.setRitmo} />
        </section>

        <ListaRoles
          itens={lista.itens}
          carregando={lista.carregando}
          erro={lista.erro}
          semPonto={!localizacao.ponto}
          onTentarDeNovo={lista.recarregar}
        />
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
