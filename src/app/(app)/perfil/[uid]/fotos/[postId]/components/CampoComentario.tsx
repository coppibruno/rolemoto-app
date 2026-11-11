"use client";

import { useState, type FormEvent } from "react";
import { LIMITE_COMENTARIO } from "@/types/post-foto";
import styles from "../post-foto.module.css";

type Props = {
  enviando: boolean;
  erro: string | null;
  onEnviar: (texto: string) => Promise<boolean>;
};

export const CampoComentario = ({ enviando, erro, onEnviar }: Props) => {
  const [texto, setTexto] = useState("");

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
