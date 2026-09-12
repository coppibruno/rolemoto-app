"use client";

import { useAuth } from "@/hooks/useAuth";
import { useLoginRedirect } from "../hooks/useLoginRedirect";
import { LoginHeader } from "./LoginHeader";
import { FormularioLogin } from "./FormularioLogin";
import { BotaoGoogle } from "./BotaoGoogle";
import { BannerSenhaRedefinida } from "./BannerSenhaRedefinida";
import { CtaInstalarApp } from "./CtaInstalarApp";
import styles from "../login.module.css";

type Props = {
  next: string | null;
  modoCadastro: boolean;
  senhaRedefinida: boolean;
};

export const TelaLogin = ({ next, modoCadastro, senhaRedefinida }: Props) => {
  const { firebaseUser, usuario, loading } = useAuth();
  const { pronto } = useLoginRedirect({
    firebaseUser,
    usuario,
    loading,
    next,
  });

  if (!pronto) {
    return (
      <main className={styles.container}>
        <div className={styles.spinner} />
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.innerWrapper}>
        <LoginHeader />
        {senhaRedefinida ? <BannerSenhaRedefinida /> : null}

        <div className={styles.card}>
          <div className={styles.cardEdge} />
          <FormularioLogin
            desabilitado={loading}
            next={next}
            modoCadastro={modoCadastro}
          />

          <div className={styles.divisor}>
            <div className={styles.divisorLinha} />
            <span className={styles.divisorLabel}>ou conecte-se com</span>
          </div>

          <BotaoGoogle desabilitado={loading} next={next} />
        </div>

        <CtaInstalarApp />
      </div>
    </main>
  );
};
