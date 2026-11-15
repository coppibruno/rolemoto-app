"use client";

import Link from "next/link";
import { hrefConversa } from "@/app/(app)/mensagens/conversa";
import { useAuth } from "@/hooks/useAuth";
import styles from "../perfil-publico.module.css";

type Props = {
  uid: string;
};

export const BotaoMensagem = ({ uid }: Props) => {
  const { firebaseUser } = useAuth();
  if (!firebaseUser || firebaseUser.uid === uid) return null;

  return (
    <Link href={hrefConversa(firebaseUser.uid, uid)} className={styles.botaoMensagem}>
      <span className="material-symbols-outlined" aria-hidden>
        chat_bubble
      </span>
      Mensagem
    </Link>
  );
};
