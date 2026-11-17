"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { LIMITE_COMENTARIO } from "@/types/post-foto";
import styles from "./comentarios.module.css";

type Props = {
  enviando: boolean;
  erro: string | null;
  onEnviar: (texto: string) => Promise<boolean>;
  autoFoco?: boolean;
  /** Incrementa para focar o campo (ex.: ícone 💬 no detalhe). */
  focoPedido?: number;
};

export const CampoComentario = ({
  enviando,
  erro,
  onEnviar,
  autoFoco = false,
  focoPedido = 0,
}: Props) => {
  const [texto, setTexto] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFoco) inputRef.current?.focus();
  }, [autoFoco]);

  useEffect(() => {
    if (!focoPedido) return;
    inputRef.current?.focus();
  }, [focoPedido]);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (await onEnviar(texto)) setTexto("");
  };

  return (
    <form className={styles.campoFixo} onSubmit={(evento) => void enviar(evento)}>
      {erro ? (
        <p className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
      <div className={styles.campoLinha}>
        <input
          ref={inputRef}
          className={styles.campo}
          value={texto}
          maxLength={LIMITE_COMENTARIO}
          placeholder="Comente"
          aria-label="Comentário"
          onChange={(evento) => setTexto(evento.target.value)}
          disabled={enviando}
        />
        <button
          type="submit"
          className={styles.enviar}
          aria-label="Enviar comentário"
          disabled={enviando || !texto.trim()}
        >
          <span className="material-symbols-outlined" aria-hidden>
            send
          </span>
        </button>
      </div>
    </form>
  );
};
