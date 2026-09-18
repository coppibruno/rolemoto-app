"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TOAST_LINK_MS } from "../constants";
import styles from "../perfil-publico.module.css";

type Props = {
  uid: string;
  nome: string;
};

export const CabecalhoVisaoComunitaria = ({ uid, nome }: Props) => {
  const router = useRouter();
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(false), TOAST_LINK_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  const voltar = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/aprovacoes");
  };

  const compartilhar = useCallback(async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/perfil/${uid}`
        : `/perfil/${uid}`;
    const titulo = `Perfil de ${nome} · Rolemoto`;
    const texto = `Confira o perfil de ${nome} no Rolemoto`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: titulo, text: texto, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast(true);
    } catch (erro) {
      if (erro instanceof Error && erro.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setToast(true);
      } catch {
        /* ignore */
      }
    }
  }, [uid, nome]);

  return (
    <>
      <div className={styles.cabecalho}>
        <button
          type="button"
          className={styles.botaoIcone}
          aria-label="Voltar"
          onClick={voltar}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className={styles.cabecalhoTitulos}>
          <span className={styles.kicker}>Visão Comunitária</span>
          <span className={styles.tituloCabecalho}>Perfil do Piloto</span>
        </div>
        <button
          type="button"
          className={styles.botaoIcone}
          aria-label="Compartilhar perfil"
          onClick={() => void compartilhar()}
        >
          <span className="material-symbols-outlined">share</span>
        </button>
      </div>
      {toast ? (
        <div className={styles.toast} role="status">
          Link copiado
        </div>
      ) : null}
    </>
  );
};
