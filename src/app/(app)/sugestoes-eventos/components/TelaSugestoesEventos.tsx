"use client";

import { GuardaAdmin } from "../../components/GuardaAdmin";
import { useListaSugestoesEventos } from "../hooks/useListaSugestoesEventos";
import { CabecalhoSugestoesEventos } from "./CabecalhoSugestoesEventos";
import { EstadoCarregandoSugestoesEventos } from "./EstadoCarregandoSugestoesEventos";
import { EstadoVazioSugestoesEventos } from "./EstadoVazioSugestoesEventos";
import { IntroSugestoesEventos } from "./IntroSugestoesEventos";
import { ListaSugestoesEventos } from "./ListaSugestoesEventos";
import styles from "../sugestoes-eventos.module.css";

const ConteudoSugestoes = () => {
  const lista = useListaSugestoesEventos();

  return (
    <div className={styles.tela}>
      <CabecalhoSugestoesEventos />
      <IntroSugestoesEventos
        buscando={lista.buscando}
        resumo={lista.resumoBusca}
        erro={lista.erroBusca}
        onBuscar={lista.buscar}
      />
      {lista.carregando ? <EstadoCarregandoSugestoesEventos /> : null}
      {!lista.carregando && lista.erro ? (
        <div className={styles.erroBloco} role="alert">
          <p>{lista.erro}</p>
          <button type="button" className={styles.recusar} onClick={lista.recarregar}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {!lista.carregando && !lista.erro && lista.itens.length === 0 ? (
        <EstadoVazioSugestoesEventos />
      ) : null}
      {!lista.carregando && !lista.erro && lista.itens.length > 0 ? (
        <ListaSugestoesEventos itens={lista.itens} onDecidida={lista.remover} />
      ) : null}
    </div>
  );
};

export const TelaSugestoesEventos = () => {
  return (
    <GuardaAdmin>
      <ConteudoSugestoes />
    </GuardaAdmin>
  );
};
