"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { mensagensService } from "@/app/(app)/mensagens/services/mensagens.service";
import { LIMITE_TEXTO_MENSAGEM } from "@/app/(app)/mensagens/constants";
import { REACOES_STORY } from "@/app/(app)/mensagens/conversa";
import { ApiError } from "@/lib/api";
import type { ReacaoStory } from "@/types/conversa";
import styles from "./player-stories.module.css";

type Props = {
  storyId: string;
  autorUid: string;
  autorApelido: string;
  onFoco: (ativo: boolean) => void;
  onEnviada: () => void;
};

const ANIMACAO_MS = 1200;

export const RespostaStory = ({ storyId, autorUid, autorApelido, onFoco, onEnviada }: Props) => {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [focado, setFocado] = useState(false);
  const [reacoesAbertas, setReacoesAbertas] = useState(false);
  const [enviada, setEnviada] = useState<{ emoji: string; chave: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const vazio = !texto.trim();
  const mostrarReacoes = (focado || reacoesAbertas) && !enviando;

  useEffect(() => () => onFoco(false), [onFoco]);

  // Segura o story enquanto a fileira de reações está aberta sem o teclado.
  useEffect(() => {
    if (reacoesAbertas) onFoco(true);
  }, [reacoesAbertas, onFoco]);

  // Tocar fora (na foto) fecha a fileira e o story volta a andar.
  useEffect(() => {
    if (!reacoesAbertas) return;
    const aoTocar = (evento: PointerEvent) => {
      if (evento.target instanceof Node && formRef.current?.contains(evento.target)) return;
      setReacoesAbertas(false);
      onFoco(false);
    };
    document.addEventListener("pointerdown", aoTocar, true);
    return () => document.removeEventListener("pointerdown", aoTocar, true);
  }, [reacoesAbertas, onFoco]);

  useEffect(() => {
    if (!enviada) return;
    const id = window.setTimeout(() => setEnviada(null), ANIMACAO_MS);
    return () => window.clearTimeout(id);
  }, [enviada]);

  const fecharReacoes = () => {
    setReacoesAbertas(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    onFoco(false);
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (vazio || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await mensagensService.enviar({
        destinatarioId: autorUid,
        texto: texto.trim(),
        storyId,
      });
      onEnviada();
      router.push(`/mensagens/${encodeURIComponent(resposta.conversaId)}`);
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : "Não deu para enviar.");
      setEnviando(false);
    }
  };

  const reagir = async (reacao: ReacaoStory, emoji: string) => {
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await mensagensService.enviar({ destinatarioId: autorUid, storyId, reacao });
      setEnviada({ emoji, chave: Date.now() });
      setTexto("");
      fecharReacoes();
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : "Não deu para reagir.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      ref={formRef}
      className={styles.resposta}
      onSubmit={(evento) => void enviar(evento)}
      onPointerDown={(evento) => evento.stopPropagation()}
    >
      {enviada ? (
        <span key={enviada.chave} className={styles.reacaoEnviada} role="status">
          <span className={styles.reacaoEnviadaEmoji} aria-hidden>
            {enviada.emoji}
          </span>
          <span className={styles.reacaoEnviadaTexto}>Reação enviada</span>
        </span>
      ) : null}
      {mostrarReacoes ? (
        <div className={styles.reacoes} role="group" aria-label={`Reagir ao story de ${autorApelido}`}>
          {REACOES_STORY.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.reacao}
              aria-label={`Reagir com ${item.rotulo}`}
              // Sem isto o campo perde o foco antes do clique e a fileira some.
              onPointerDown={(evento) => evento.preventDefault()}
              onClick={() => void reagir(item.id, item.emoji)}
            >
              {item.emoji}
            </button>
          ))}
        </div>
      ) : null}
      {erro ? (
        <p className={styles.respostaErro} role="alert">
          {erro}
        </p>
      ) : null}
      <div className={styles.respostaLinha}>
        <input
          type="text"
          className={styles.respostaCampo}
          value={texto}
          maxLength={LIMITE_TEXTO_MENSAGEM}
          placeholder={`Responder ${autorApelido}`}
          aria-label="Responder"
          enterKeyHint="send"
          autoComplete="off"
          disabled={enviando}
          onFocus={() => {
            setFocado(true);
            onFoco(true);
          }}
          onBlur={() => {
            setFocado(false);
            if (!reacoesAbertas) onFoco(false);
          }}
          onChange={(evento) => setTexto(evento.target.value)}
        />
        {vazio ? (
          <button
            type="button"
            className={`${styles.respostaReagir} ${reacoesAbertas ? styles.respostaReagirAtivo : ""}`}
            aria-label={reacoesAbertas ? "Fechar reações" : "Reagir ao story"}
            aria-expanded={reacoesAbertas}
            onPointerDown={(evento) => evento.preventDefault()}
            onClick={() => (reacoesAbertas ? fecharReacoes() : setReacoesAbertas(true))}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {reacoesAbertas ? "close" : "add_reaction"}
            </span>
          </button>
        ) : (
          <button
            type="submit"
            className={styles.respostaEnviar}
            aria-label="Enviar resposta"
            disabled={enviando}
          >
            <span className="material-symbols-outlined" aria-hidden>
              send
            </span>
          </button>
        )}
      </div>
    </form>
  );
};
