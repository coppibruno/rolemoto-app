"use client";

import { useAuth } from "@/hooks/useAuth";
import { COPY_CAIXA_VAZIA } from "../constants";
import { useCaixaMensagens } from "../hooks/useCaixaMensagens";
import { CabecalhoMensagens } from "./CabecalhoMensagens";
import { LinhaConversa } from "./LinhaConversa";
import styles from "../mensagens.module.css";

export const TelaMensagens = () => {
  const { firebaseUser } = useAuth();
  const caixa = useCaixaMensagens();
  const meuUid = firebaseUser?.uid ?? "";

  return (
    <div className={styles.tela}>
      <CabecalhoMensagens titulo="Mensagens" hrefVoltar="/" />

      {caixa.carregando ? <p className={styles.aviso}>Carregando…</p> : null}
      {caixa.erro ? (
        <div className={styles.erro}>
          <p>{caixa.erro}</p>
          <button type="button" onClick={() => void caixa.recarregar()}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {!caixa.carregando && !caixa.erro && caixa.itens.length === 0 ? (
        <p className={styles.aviso}>{COPY_CAIXA_VAZIA}</p>
      ) : null}
      {caixa.itens.length > 0 ? (
        <ul className={styles.lista}>
          {caixa.itens.map((conversa) => (
            <li key={conversa.id}>
              <LinhaConversa conversa={conversa} meuUid={meuUid} />
            </li>
          ))}
        </ul>
      ) : null}
      {caixa.temMais ? (
        <button
          type="button"
          className={styles.botaoMais}
          onClick={() => void caixa.carregarMais()}
          disabled={caixa.carregandoMais}
        >
          {caixa.carregandoMais ? "Carregando…" : "Ver mais"}
        </button>
      ) : null}
    </div>
  );
};
