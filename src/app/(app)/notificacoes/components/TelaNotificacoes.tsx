"use client";

import { COPY } from "../constants";
import { useNotificacoes } from "../hooks/useNotificacoes";
import styles from "../notificacoes.module.css";
import { CabecalhoNotificacoes } from "./CabecalhoNotificacoes";
import { LinhaNotificacao } from "./LinhaNotificacao";

export const TelaNotificacoes = () => {
  const tela = useNotificacoes();
  const temNaoLida = tela.itens.some((item) => !item.lida);

  return (
    <main className={styles.tela}>
      <CabecalhoNotificacoes
        podeMarcarTodas={temNaoLida}
        marcandoTodas={tela.marcandoTodas}
        onMarcarTodas={() => void tela.marcarTodas()}
      />

      {tela.carregando ? <p className={styles.aviso}>Carregando…</p> : null}

      {tela.erro ? (
        <div className={styles.erro}>
          <p>{COPY.erro}</p>
          <button type="button" onClick={() => void tela.carregar()}>
            {COPY.tentar}
          </button>
        </div>
      ) : null}

      {!tela.carregando && !tela.erro && tela.itens.length === 0 ? (
        <p className={styles.aviso}>{COPY.empty}</p>
      ) : null}

      {tela.itens.length > 0 ? (
        <ul className={styles.lista}>
          {tela.itens.map((item) => (
            <LinhaNotificacao key={item.id} item={item} onAbrir={(n) => void tela.abrir(n)} />
          ))}
        </ul>
      ) : null}

      {tela.temMais ? (
        <button
          type="button"
          className={styles.mais}
          disabled={tela.carregandoMais}
          onClick={() => void tela.carregarMais()}
        >
          {tela.carregandoMais ? "Carregando…" : "Ver mais"}
        </button>
      ) : null}
    </main>
  );
};
