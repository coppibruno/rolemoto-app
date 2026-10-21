"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { obterAdapterGps } from "@/lib/telemetria/telemetria-gps.adapter";
import styles from "../offline.module.css";

export const TelaOffline = () => {
  const [passeioSalvo, setPasseioSalvo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const checar = async () => {
      try {
        const adapter = await obterAdapterGps();
        if (!adapter.isNative()) return;
        const pendente = await adapter.getResumoPendente();
        if (!cancelado) setPasseioSalvo(pendente != null);
      } catch {
        if (!cancelado) setPasseioSalvo(false);
      }
    };
    void checar();
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <main className={styles.tela}>
      <span className={`material-symbols-outlined ${styles.icone}`} aria-hidden>
        wifi_off
      </span>
      <h1 className={styles.titulo}>Sem conexão</h1>
      <p className={styles.corpo}>
        Os rolês precisam de internet. Se você gravou um passeio, ele fica
        salvo no celular e é enviado quando a conexão voltar.
      </p>
      <button
        type="button"
        className={styles.botao}
        onClick={() => window.location.reload()}
      >
        Tentar de novo
      </button>
      {passeioSalvo ? (
        <Link href="/gravar-role" className={styles.linkSecundario}>
          Ver passeio salvo
        </Link>
      ) : null}
    </main>
  );
};
