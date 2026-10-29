"use client";

import { GuardaAdmin } from "../../components/GuardaAdmin";
import { useListaSugestoesLocais } from "../hooks/useListaSugestoesLocais";
import { CabecalhoSugestoesLocais } from "./CabecalhoSugestoesLocais";
import { EstadoCarregandoSugestoes } from "./EstadoCarregandoSugestoes";
import { EstadoVazioSugestoes } from "./EstadoVazioSugestoes";
import { IntroSugestoesLocais } from "./IntroSugestoesLocais";
import { ListaSugestoesLocais } from "./ListaSugestoesLocais";
import styles from "../sugestoes-locais.module.css";

const ConteudoSugestoes = () => {
  const lista = useListaSugestoesLocais();

  return (
    <div className={styles.tela}>
      <CabecalhoSugestoesLocais />
      <IntroSugestoesLocais
        buscando={lista.buscando}
        resumo={lista.resumoBusca}
        erro={lista.erroBusca}
        facetas={lista.facetas}
        onAlternarFaceta={lista.alternarFaceta}
        onBuscar={lista.buscar}
      />
      {lista.carregando ? <EstadoCarregandoSugestoes /> : null}
      {!lista.carregando && lista.erro ? (
        <div className={styles.erroBloco} role="alert">
          <p>{lista.erro}</p>
          <button type="button" className={styles.recusar} onClick={lista.recarregar}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {!lista.carregando && !lista.erro && lista.itens.length === 0 ? (
        <EstadoVazioSugestoes />
      ) : null}
      {!lista.carregando && !lista.erro && lista.itens.length > 0 ? (
        <ListaSugestoesLocais itens={lista.itens} onDecidida={lista.remover} />
      ) : null}
    </div>
  );
};

export const TelaSugestoesLocais = () => {
  return (
    <GuardaAdmin>
      <ConteudoSugestoes />
    </GuardaAdmin>
  );
};
