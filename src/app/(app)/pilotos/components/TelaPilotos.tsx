"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LinhaPiloto } from "@/app/(app)/seguir/components/LinhaPiloto";
import { useBuscaPilotos } from "../hooks/useBuscaPilotos";
import { usePontoSugestao } from "../hooks/usePontoSugestao";
import { useSugestoesPilotos } from "../hooks/useSugestoesPilotos";
import { BlocoConhecer } from "./BlocoConhecer";
import { BlocoSeguindo } from "./BlocoSeguindo";
import styles from "../pilotos.module.css";

export const TelaPilotos = () => {
  const router = useRouter();
  const campoRef = useRef<HTMLInputElement>(null);
  const busca = useBuscaPilotos();
  const local = usePontoSugestao();
  const sugestoes = useSugestoesPilotos(local.ponto, local.pronto);
  const modo = busca.termo.length >= 2 ? "busca" : busca.termo.length === 1 ? "letra" : "vazio";

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

      {modo === "busca" ? (
        <>
          {busca.faseBusca === "carregando" ? <p className={styles.aviso}>Buscando…</p> : null}
          {busca.faseBusca === "vazio" ? (
            <p className={styles.aviso}>Nenhum piloto com esse nome</p>
          ) : null}
          {busca.faseBusca === "erro" ? (
            <div className={styles.erro}>
              <p>Não deu para buscar agora.</p>
              <button type="button" onClick={busca.tentarBusca}>
                Tentar de novo
              </button>
            </div>
          ) : null}
          {busca.faseBusca === "ok" ? (
            <ul className={styles.lista}>
              {busca.itensBusca.map((pessoa) => (
                <li key={pessoa.uid}>
                  <LinhaPiloto pessoa={pessoa} />
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <>
          <BlocoSeguindo
            fase={busca.faseSeguidos}
            itens={busca.seguidos}
            onTentar={busca.tentarSeguidos}
          />
          {modo === "vazio" ? (
            <BlocoConhecer
              fase={sugestoes.fase}
              itens={sugestoes.itens}
              toast={sugestoes.toast}
              onTentar={() => void sugestoes.recarregar()}
              onDispensar={(uid) => void sugestoes.dispensar(uid)}
              onSeguir={(pessoa) => {
                sugestoes.remover(pessoa.uid);
                busca.colocarNoTopo({ ...pessoa, seguidoPorMim: true });
              }}
            />
          ) : null}
        </>
      )}
    </div>
  );
};
