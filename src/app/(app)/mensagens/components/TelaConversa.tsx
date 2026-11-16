"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, type UIEvent } from "react";
import { useCamadaCheia } from "@/app/(app)/stories/camada-cheia";
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

const FOLGA_TOPO_PX = 120;

export const TelaConversa = ({ conversaId }: Props) => {
  const { firebaseUser } = useAuth();
  const conversa = useConversa(conversaId);
  // Tela cheia como a do Instagram: sem menu inferior e o campo acompanha o teclado.
  useCamadaCheia(true);
  const rolagemRef = useRef<HTMLDivElement>(null);
  const alturaAntesRef = useRef<number | null>(null);
  const meuUid = firebaseUser?.uid ?? "";
  const total = conversa.mensagens.length;
  const primeiraId = conversa.mensagens[0]?.id;
  const ultimaId = conversa.mensagens[total - 1]?.id;

  // Antigas entram em cima: mantém na tela a mensagem que o piloto estava lendo.
  useLayoutEffect(() => {
    const rolagem = rolagemRef.current;
    const antes = alturaAntesRef.current;
    if (!rolagem || antes === null) return;
    rolagem.scrollTop += rolagem.scrollHeight - antes;
    alturaAntesRef.current = null;
  }, [primeiraId]);

  // A conversa abre na mais recente, e cada mensagem nova desce até o fim.
  useLayoutEffect(() => {
    const rolagem = rolagemRef.current;
    if (rolagem && ultimaId) rolagem.scrollTop = rolagem.scrollHeight;
  }, [ultimaId]);

  const carregarAntigas = () => {
    if (!conversa.temAntigas || conversa.carregandoAntigas) return;
    alturaAntesRef.current = rolagemRef.current?.scrollHeight ?? null;
    void conversa.carregarAntigas();
  };

  const aoRolar = (evento: UIEvent<HTMLDivElement>) => {
    if (evento.currentTarget.scrollTop < FOLGA_TOPO_PX) carregarAntigas();
  };

  const titulo = conversa.outro ? (
    <Link href={`/perfil/${conversa.outro.uid}`} className={styles.tituloPessoa}>
      <FotoPessoa fotoUrl={conversa.outro.fotoUrl} pequena />
      <span>{nomeNaConversa(conversa.outro)}</span>
    </Link>
  ) : (
    "Conversa"
  );

  return (
    <div className={styles.telaConversa}>
      <div className={styles.colunaConversa}>
        <CabecalhoMensagens titulo={titulo} hrefVoltar="/mensagens" />

        <div className={styles.rolagemConversa} ref={rolagemRef} onScroll={aoRolar}>
          <div className={styles.mensagensConversa}>
            {conversa.temAntigas ? (
              <button
                type="button"
                className={styles.botaoMais}
                onClick={carregarAntigas}
                disabled={conversa.carregandoAntigas}
              >
                {conversa.carregandoAntigas ? "Carregando…" : "Mensagens anteriores"}
              </button>
            ) : null}

            {conversa.carregando ? <p className={styles.aviso}>Carregando…</p> : null}
            {conversa.erro ? (
              <div className={styles.erro}>
                <p>{conversa.erro}</p>
                <button type="button" onClick={() => void conversa.recarregar()}>
                  Tentar de novo
                </button>
              </div>
            ) : null}

            {!conversa.carregando && !conversa.erro && total === 0 && conversa.outro ? (
              <p className={styles.avisoCentro}>
                Mande a primeira mensagem para {nomeNaConversa(conversa.outro)}.
              </p>
            ) : null}

            {conversa.mensagens.map((mensagem) => (
              <BalaoMensagem
                key={mensagem.id}
                mensagem={mensagem}
                minha={mensagem.autorId === meuUid}
                onAlternarCurtida={conversa.alternarCurtida}
              />
            ))}
          </div>
        </div>

        {conversa.outro ? (
          <CaixaEnvio
            enviando={conversa.enviando}
            erro={conversa.erroEnvio}
            onEnviar={conversa.enviar}
          />
        ) : null}
      </div>
    </div>
  );
};
