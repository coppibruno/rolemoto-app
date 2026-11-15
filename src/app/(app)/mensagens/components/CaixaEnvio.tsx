"use client";

import { useState, type FormEvent } from "react";
import { LIMITE_TEXTO_MENSAGEM } from "../constants";
import styles from "../mensagens.module.css";

type Props = {
  enviando: boolean;
  erro: string | null;
  desabilitado?: boolean;
  onEnviar: (texto: string) => Promise<boolean>;
};

export const CaixaEnvio = ({ enviando, erro, desabilitado, onEnviar }: Props) => {
  const [texto, setTexto] = useState("");
  const vazio = !texto.trim();

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (vazio || enviando) return;
    if (await onEnviar(texto)) setTexto("");
  };

  return (
    <form className={styles.caixaEnvio} onSubmit={(evento) => void enviar(evento)}>
      {erro ? (
        <p className={styles.erroEnvio} role="alert">
          {erro}
        </p>
      ) : null}
      <div className={styles.caixaEnvioLinha}>
        <textarea
          className={styles.campoMensagem}
          value={texto}
          rows={1}
          maxLength={LIMITE_TEXTO_MENSAGEM}
          placeholder="Mensagem"
          aria-label="Mensagem"
          enterKeyHint="send"
          disabled={desabilitado}
          onChange={(evento) => setTexto(evento.target.value)}
        />
        <button
          type="submit"
          className={styles.botaoEnviar}
          aria-label="Enviar"
          disabled={vazio || enviando || desabilitado}
        >
          <span className="material-symbols-outlined" aria-hidden>
            send
          </span>
        </button>
      </div>
    </form>
  );
};
