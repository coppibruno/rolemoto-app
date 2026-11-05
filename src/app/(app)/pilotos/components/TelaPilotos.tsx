"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LinhaPiloto } from "@/app/(app)/seguir/components/LinhaPiloto";
import { useBuscaPilotos } from "../hooks/useBuscaPilotos";
import styles from "../pilotos.module.css";

export const TelaPilotos = () => {
  const router = useRouter();
  const campoRef = useRef<HTMLInputElement>(null);
  const busca = useBuscaPilotos();

  useEffect(() => {
    campoRef.current?.focus();
  }, []);

  const voltar = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <button type="button" className={styles.botaoVoltar} aria-label="Voltar" onClick={voltar}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className={styles.titulo}>Pilotos</h1>
        <span className={styles.espaco} aria-hidden />
      </header>

      <label className={styles.campo}>
        <span className="material-symbols-outlined" aria-hidden>
          search
        </span>
        <input
          ref={campoRef}
          type="search"
          value={busca.texto}
          placeholder="Nome ou apelido"
          aria-label="Nome ou apelido"
          enterKeyHint="search"
          autoComplete="off"
          onChange={(evento) => busca.setTexto(evento.target.value)}
        />
      </label>

      {busca.fase === "curto" ? (
        <p className={styles.aviso}>Digite pelo menos 2 letras</p>
      ) : null}
      {busca.fase === "carregando" ? <p className={styles.aviso}>Buscando…</p> : null}
      {busca.fase === "vazio" ? (
        <p className={styles.aviso}>Nenhum piloto com esse nome</p>
      ) : null}
      {busca.fase === "erro" ? (
        <div className={styles.erro}>
          <p>Não deu para buscar agora.</p>
          <button type="button" onClick={busca.tentarDeNovo}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {busca.fase === "ok" ? (
        <ul className={styles.lista}>
          {busca.itens.map((pessoa) => (
            <li key={pessoa.uid}>
              <LinhaPiloto pessoa={pessoa} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
