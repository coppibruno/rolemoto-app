"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LinhaPiloto } from "@/app/(app)/seguir/components/LinhaPiloto";
import { apelidoExibicao } from "@/lib/apelido";
import { useAuth } from "@/hooks/useAuth";
import type { AbaSeguir } from "@/types/seguir";
import { perfilPublicoService } from "../../services/perfil-publico.service";
import { useListaSeguir } from "../hooks/useListaSeguir";
import styles from "../seguindo.module.css";

type Props = {
  uid: string;
  abaInicial: AbaSeguir;
};

const textoVazio = (aba: AbaSeguir, meu: boolean) => {
  if (aba === "seguindo" && meu) return "Você ainda não segue ninguém";
  if (aba === "seguidores" && meu) return "Ninguém te segue ainda";
  return "Ninguém por aqui";
};

export const TelaListasSeguir = ({ uid, abaInicial }: Props) => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [aba, setAba] = useState<AbaSeguir>(abaInicial);
  const [titulo, setTitulo] = useState("Pilotos");
  const lista = useListaSeguir(uid, aba);
  const meu = usuario?.uid === uid;

  useEffect(() => {
    let cancelado = false;
    if (meu && usuario) {
      setTitulo(apelidoExibicao(usuario.nome, usuario.apelido));
      return;
    }
    void perfilPublicoService.buscar(uid).then((perfil) => {
      if (!cancelado && perfil) setTitulo(perfil.apelido || "piloto");
    });
    return () => {
      cancelado = true;
    };
  }, [uid, meu, usuario]);

  const voltar = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(meu ? "/perfil" : `/perfil/${uid}`);
  };

  const escolher = (proxima: AbaSeguir) => {
    setAba(proxima);
    router.replace(`/perfil/${uid}/seguindo?aba=${proxima}`);
  };

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <button type="button" className={styles.botaoVoltar} aria-label="Voltar" onClick={voltar}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className={styles.titulo}>{titulo}</h1>
        <span className={styles.espaco} aria-hidden />
      </header>

      <div className={styles.abas} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={aba === "seguindo"}
          className={aba === "seguindo" ? styles.abaAtiva : styles.aba}
          onClick={() => escolher("seguindo")}
        >
          Seguindo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === "seguidores"}
          className={aba === "seguidores" ? styles.abaAtiva : styles.aba}
          onClick={() => escolher("seguidores")}
        >
          Seguidores
        </button>
      </div>

      {lista.naoEncontrado ? <p className={styles.aviso}>Perfil não encontrado</p> : null}
      {lista.carregando ? <p className={styles.aviso}>Carregando…</p> : null}
      {lista.erro ? (
        <div className={styles.erro}>
          <p>{lista.erro}</p>
          <button type="button" onClick={() => void lista.recarregar()}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {!lista.carregando && !lista.erro && !lista.naoEncontrado && lista.itens.length === 0 && !lista.cursor ? (
        <div className={styles.vazio}>
          <p>{textoVazio(aba, meu)}</p>
          {aba === "seguindo" && meu ? (
            <Link href="/pilotos">Encontrar pilotos</Link>
          ) : null}
        </div>
      ) : null}
      {lista.itens.length > 0 ? (
        <ul className={styles.lista}>
          {lista.itens.map((pessoa) => (
            <li key={pessoa.uid}>
              <LinhaPiloto pessoa={pessoa} />
            </li>
          ))}
        </ul>
      ) : null}
      <div ref={lista.sentinelaRef} className={styles.sentinela} />
      {lista.carregandoMais ? <p className={styles.aviso}>Carregando…</p> : null}
    </div>
  );
};
