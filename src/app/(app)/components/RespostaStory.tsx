"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { mensagensService } from "@/app/(app)/mensagens/services/mensagens.service";
import { LIMITE_TEXTO_MENSAGEM } from "@/app/(app)/mensagens/constants";
import { ApiError } from "@/lib/api";
import styles from "./player-stories.module.css";

type Props = {
  storyId: string;
  autorUid: string;
  autorApelido: string;
  onFoco: (ativo: boolean) => void;
  onEnviada: () => void;
};

export const RespostaStory = ({ storyId, autorUid, autorApelido, onFoco, onEnviada }: Props) => {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const vazio = !texto.trim();

  useEffect(() => () => onFoco(false), [onFoco]);

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

  return (
    <form
      className={styles.resposta}
      onSubmit={(evento) => void enviar(evento)}
      onPointerDown={(evento) => evento.stopPropagation()}
    >
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
          onFocus={() => onFoco(true)}
          onBlur={() => onFoco(false)}
          onChange={(evento) => setTexto(evento.target.value)}
        />
        <button
          type="submit"
          className={styles.respostaEnviar}
          aria-label="Enviar resposta"
          disabled={vazio || enviando}
        >
          <span className="material-symbols-outlined" aria-hidden>
            send
          </span>
        </button>
      </div>
    </form>
  );
};
