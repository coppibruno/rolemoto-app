"use client";

import { useState } from "react";
import { rolesService } from "@/app/(app)/criar-role/services/roles.service";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import styles from "../meus-roles.module.css";

type Props = {
  roleId: string;
  titulo: string;
  fixado: boolean;
};

export const BotaoFixarGaragem = ({ roleId, titulo, fixado: inicial }: Props) => {
  const { recarregarPerfil } = useAuth();
  const [fixado, setFixado] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const alternar = async () => {
    if (enviando) return;
    const proximo = !fixado;
    setEnviando(true);
    setErro(null);
    setFixado(proximo);
    try {
      await rolesService.fixar(roleId, proximo);
      void recarregarPerfil();
    } catch (falha) {
      setFixado(!proximo);
      setErro(falha instanceof ApiError ? falha.message : "Não deu para fixar agora.");
      window.setTimeout(() => setErro(null), 2600);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.botaoIconeArquivo} ${fixado ? styles.botaoIconeArquivoAtivo : ""}`}
        aria-pressed={fixado}
        aria-label={fixado ? `Desfixar ${titulo}` : `Fixar ${titulo}`}
        title={fixado ? "Desfixar" : "Fixar"}
        disabled={enviando}
        onClick={() => void alternar()}
      >
        <span className="material-symbols-outlined" aria-hidden>
          {fixado ? "keep_off" : "keep"}
        </span>
      </button>
      {erro ? (
        <p className={styles.alertaAcao} role="alert">
          {erro}
        </p>
      ) : null}
    </>
  );
};
