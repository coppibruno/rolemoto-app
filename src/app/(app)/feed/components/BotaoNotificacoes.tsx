"use client";

import Link from "next/link";
import { useNotificacoesNaoLidas } from "@/hooks/useNotificacoesNaoLidas";
import styles from "../feed.module.css";

const rotuloContador = (total: number): string => (total > 9 ? "9+" : String(total));

export const BotaoNotificacoes = ({ habilitado }: { habilitado: boolean }) => {
  const total = useNotificacoesNaoLidas(habilitado);
  const rotulo =
    total > 0
      ? `Notificações, ${total} ${total === 1 ? "não lida" : "não lidas"}`
      : "Notificações";

  return (
    <Link href="/notificacoes" className={styles.encontrarPilotos} aria-label={rotulo}>
      <span className="material-symbols-outlined" aria-hidden>
        notifications
      </span>
      {total > 0 ? (
        <span className={styles.contadorMensagens} aria-hidden>
          {rotuloContador(total)}
        </span>
      ) : null}
    </Link>
  );
};
