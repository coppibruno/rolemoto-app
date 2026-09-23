"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { urlDefinirSenhaComNext } from "@/lib/destino-pos-auth";
import styles from "../perfil.module.css";

export const BotaoCriarSenha = () => {
  const { temSenha } = useAuth();

  if (temSenha) return null;

  return (
    <Link href={urlDefinirSenhaComNext("/perfil")} className={styles.botaoInstalar}>
      <span className="material-symbols-outlined" aria-hidden>
        password
      </span>
      Criar senha do Rolemoto
    </Link>
  );
};
