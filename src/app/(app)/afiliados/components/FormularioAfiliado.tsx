"use client";

import { useState, type FormEvent } from "react";
import { normalizarCodigoAfiliado } from "@/lib/afiliado";
import styles from "../afiliados.module.css";

type Props = {
  criando: boolean;
  erro: string | null;
  onCriar: (codigo: string, nome: string) => Promise<boolean>;
};

export const FormularioAfiliado = ({ criando, erro, onCriar }: Props) => {
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const codigoValido = normalizarCodigoAfiliado(codigo);
  const nomeValido = nome.trim().length >= 1 && nome.trim().length <= 60;

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!codigoValido || !nomeValido) return;
    if (await onCriar(codigoValido, nome.trim())) {
      setNome("");
      setCodigo("");
    }
  };

  return (
    <form className={styles.formulario} onSubmit={(evento) => void enviar(evento)}>
      <h2 className={styles.subtitulo}>Novo link</h2>
      <label className={styles.campo}>
        <span>Nome</span>
        <input
          value={nome}
          maxLength={60}
          placeholder="Ex.: João Moto Vlog"
          onChange={(evento) => setNome(evento.target.value)}
        />
      </label>
      <label className={styles.campo}>
        <span>Código</span>
        <input
          value={codigo}
          maxLength={20}
          placeholder="joao-moto"
          autoCapitalize="none"
          autoComplete="off"
          onChange={(evento) => setCodigo(evento.target.value.toLowerCase())}
        />
        <small>3 a 20 letras minúsculas, números ou hífen.</small>
      </label>
      {erro ? (
        <p className={styles.erroTexto} role="alert">
          {erro}
        </p>
      ) : null}
      <button
        type="submit"
        className={styles.cta}
        disabled={!codigoValido || !nomeValido || criando}
      >
        {criando ? "Criando…" : "Criar link"}
      </button>
    </form>
  );
};
