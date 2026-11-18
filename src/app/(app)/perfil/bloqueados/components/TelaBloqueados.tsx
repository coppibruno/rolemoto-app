"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import type { LinhaBloqueio } from "@/types/moderacao";
import { moderacaoService } from "@/app/(app)/moderacao/services/moderacao.service";
import styles from "@/app/(app)/moderacao/moderacao.module.css";

export const TelaBloqueados = () => {
  const router = useRouter();
  const [itens, setItens] = useState<LinhaBloqueio[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = useCallback(async (proximo: string | null, acumular: boolean) => {
    setErro(null);
    if (!acumular) setCarregando(true);
    try {
      const pagina = await moderacaoService.listar(proximo);
      setItens((atual) => (acumular ? [...atual, ...pagina.itens] : pagina.itens));
      setCursor(pagina.proximoCursor);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível carregar");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar(null, false);
  }, [carregar]);

  const desbloquear = async (uid: string) => {
    if (ocupado) return;
    setOcupado(uid);
    try {
      await moderacaoService.desbloquear(uid);
      setItens((atual) => atual.filter((item) => item.uid !== uid));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível desbloquear");
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className={styles.telaBloqueados}>
      <header className={styles.cabecalhoBloqueados}>
        <button
          type="button"
          className={styles.voltar}
          aria-label="Voltar"
          onClick={() => router.push("/perfil")}
        >
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
        </button>
        <h1 className={styles.tituloPagina}>Bloqueados</h1>
      </header>

      {carregando ? <p className={styles.vazio}>Carregando…</p> : null}
      {erro ? (
        <p className={styles.vazio} role="alert">
          {erro}
        </p>
      ) : null}
      {!carregando && !erro && itens.length === 0 ? (
        <p className={styles.vazio}>Ninguém bloqueado</p>
      ) : null}

      <ul className={styles.lista}>
        {itens.map((item) => (
          <li key={item.uid} className={styles.linha}>
            {item.fotoUrl ? (
              <img
                src={item.fotoUrl}
                alt=""
                className={styles.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className={styles.avatarVazio} aria-hidden>
                <span className="material-symbols-outlined">account_circle</span>
              </span>
            )}
            <div className={styles.textos}>
              <span className={styles.nome}>{item.nome || item.apelido}</span>
              <span className={styles.apelido}>@{item.apelido}</span>
            </div>
            <button
              type="button"
              className={styles.botaoDesbloquear}
              disabled={ocupado === item.uid}
              onClick={() => void desbloquear(item.uid)}
            >
              Desbloquear
            </button>
          </li>
        ))}
      </ul>

      {cursor ? (
        <button
          type="button"
          className={styles.botaoCancelar}
          onClick={() => void carregar(cursor, true)}
        >
          Carregar mais
        </button>
      ) : null}
    </div>
  );
};
