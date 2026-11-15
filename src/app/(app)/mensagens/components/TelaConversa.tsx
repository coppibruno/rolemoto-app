"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { nomeNaConversa } from "../conversa";
import { useConversa } from "../hooks/useConversa";
import { BalaoMensagem } from "./BalaoMensagem";
import { CabecalhoMensagens } from "./CabecalhoMensagens";
import { CaixaEnvio } from "./CaixaEnvio";
import { FotoPessoa } from "./FotoPessoa";
import styles from "../mensagens.module.css";

type Props = {
  conversaId: string;
};

export const TelaConversa = ({ conversaId }: Props) => {
  const { firebaseUser } = useAuth();
  const conversa = useConversa(conversaId);
  const fimRef = useRef<HTMLDivElement>(null);
  const meuUid = firebaseUser?.uid ?? "";
  const total = conversa.mensagens.length;
  const ultimaId = conversa.mensagens[total - 1]?.id;

  useEffect(() => {
    if (ultimaId) fimRef.current?.scrollIntoView({ block: "end" });
  }, [ultimaId]);

  const titulo = conversa.outro ? (
    <Link href={`/perfil/${conversa.outro.uid}`} className={styles.tituloPessoa}>
      <FotoPessoa fotoUrl={conversa.outro.fotoUrl} pequena />
      <span>{nomeNaConversa(conversa.outro)}</span>
    </Link>
  ) : (
    "Conversa"
  );

  return (
    <div className={styles.tela}>
      <CabecalhoMensagens titulo={titulo} hrefVoltar="/mensagens" />

      {conversa.carregando ? <p className={styles.aviso}>Carregando…</p> : null}
      {conversa.erro ? (
        <div className={styles.erro}>
          <p>{conversa.erro}</p>
          <button type="button" onClick={() => void conversa.recarregar()}>
            Tentar de novo
          </button>
        </div>
      ) : null}

      {conversa.temAntigas ? (
        <button
          type="button"
          className={styles.botaoMais}
          onClick={() => void conversa.carregarAntigas()}
          disabled={conversa.carregandoAntigas}
        >
          {conversa.carregandoAntigas ? "Carregando…" : "Mensagens anteriores"}
        </button>
      ) : null}

      {!conversa.carregando && !conversa.erro && total === 0 && conversa.outro ? (
        <p className={styles.aviso}>
          Mande a primeira mensagem para {nomeNaConversa(conversa.outro)}.
        </p>
      ) : null}

      <div className={styles.mensagens}>
        {conversa.mensagens.map((mensagem) => (
          <BalaoMensagem key={mensagem.id} mensagem={mensagem} minha={mensagem.autorId === meuUid} />
        ))}
        <div ref={fimRef} />
      </div>

      {conversa.outro ? (
        <CaixaEnvio
          enviando={conversa.enviando}
          erro={conversa.erroEnvio}
          onEnviar={conversa.enviar}
        />
      ) : null}
    </div>
  );
};
