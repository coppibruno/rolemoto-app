"use client";

import Link from "next/link";
import { useMensagensNaoLidas } from "@/hooks/useMensagensNaoLidas";
import styles from "../feed.module.css";

const rotuloContador = (total: number): string => (total > 9 ? "9+" : String(total));

export const BotaoMensagens = ({ habilitado }: { habilitado: boolean }) => {
  const total = useMensagensNaoLidas(habilitado);
  const rotulo =
    total > 0
      ? `Mensagens, ${total} ${total === 1 ? "conversa não lida" : "conversas não lidas"}`
      : "Mensagens";

  return (
    <Link href="/mensagens" className={styles.encontrarPilotos} aria-label={rotulo}>
      <span className="material-symbols-outlined" aria-hidden>
        chat_bubble
      </span>
      {total > 0 ? (
        <span className={styles.contadorMensagens} aria-hidden>
          {rotuloContador(total)}
        </span>
      ) : null}
    </Link>
  );
};
