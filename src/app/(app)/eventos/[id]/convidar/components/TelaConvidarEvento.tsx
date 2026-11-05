"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConvidarEvento } from "../hooks/useConvidarEvento";
import { BarraConvidar } from "./BarraConvidar";
import { ListaConvidar } from "./ListaConvidar";
import { ResultadoConviteEvento } from "./ResultadoConviteEvento";
import styles from "../convidar.module.css";

type Props = {
  id: string;
};

export const TelaConvidarEvento = ({ id }: Props) => {
  const router = useRouter();
  const campoRef = useRef<HTMLInputElement>(null);
  const convite = useConvidarEvento(id);
  const listaAberta = Boolean(convite.evento && convite.aberto && !convite.resultado);

  useEffect(() => {
    if (listaAberta) campoRef.current?.focus();
  }, [listaAberta]);

  const voltar = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/eventos/${id}`);
  };

  const fraseFechado = convite.evento?.cancelada
    ? "Esta data foi cancelada"
    : "Este evento já encerrou";

  return (
    <div className={listaAberta ? styles.telaComBarra : styles.tela}>
      <header className={styles.cabecalho}>
        <button type="button" className={styles.botaoVoltar} aria-label="Voltar" onClick={voltar}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className={styles.titulo}>Convidar</h1>
        <span className={styles.espaco} aria-hidden />
      </header>

      {convite.faseEvento === "carregando" ? <p className={styles.aviso}>Carregando…</p> : null}
      {convite.faseEvento === "erro" ? (
        <div className={styles.erro}>
          <p>{convite.mensagemEvento}</p>
          {convite.mensagemEvento !== "Evento não encontrado" ? (
            <button type="button" onClick={convite.tentarEvento}>
              Tentar de novo
            </button>
          ) : null}
        </div>
      ) : null}

      {convite.evento ? <p className={styles.subtitulo}>{convite.evento.titulo}</p> : null}

      {convite.evento && !convite.aberto ? <p className={styles.aviso}>{fraseFechado}</p> : null}

      {listaAberta ? (
        <>
          <label className={styles.campo}>
            <span className="material-symbols-outlined" aria-hidden>
              search
            </span>
            <input
              ref={campoRef}
              type="search"
              value={convite.texto}
              placeholder="Nome ou apelido"
              aria-label="Nome ou apelido"
              enterKeyHint="search"
              autoComplete="off"
              onChange={(evento) => convite.setTexto(evento.target.value)}
            />
          </label>

          {convite.modo === "curto" ? (
            <p className={styles.aviso}>Digite pelo menos 2 letras</p>
          ) : null}

          {convite.modo !== "busca" ? (
            <div className={styles.chips}>
              <button
                type="button"
                className={convite.chip === "seguindo" ? styles.chipAtivo : styles.chip}
                aria-pressed={convite.chip === "seguindo"}
                onClick={() => convite.setChip("seguindo")}
              >
                Seguindo
              </button>
              <button
                type="button"
                className={convite.chip === "seguidores" ? styles.chipAtivo : styles.chip}
                aria-pressed={convite.chip === "seguidores"}
                onClick={() => convite.setChip("seguidores")}
              >
                Seguidores
              </button>
            </div>
          ) : null}

          {convite.modo !== "curto" ? (
            <ListaConvidar
              pessoas={convite.itens}
              fase={convite.authLoading ? "carregando" : convite.faseLista}
              vazio={convite.textoVazio}
              inscritos={convite.inscritos}
              convidados={convite.convidados}
              marcados={convite.marcados}
              onAlternar={convite.alternar}
              onTentar={convite.tentarLista}
            />
          ) : null}

          {convite.evento ? (
            <BarraConvidar
              acesso={convite.evento.acesso}
              total={convite.marcados.size}
              enviando={convite.enviando}
              avisoTeto={convite.avisoTeto}
              onConfirmar={convite.confirmar}
            />
          ) : null}
        </>
      ) : null}

      {convite.resultado && convite.evento ? (
        <ResultadoConviteEvento resultado={convite.resultado} evento={convite.evento} />
      ) : null}

      {convite.toast ? (
        <p className={styles.toast} role="status">
          {convite.toast}
        </p>
      ) : null}
    </div>
  );
};
