"use client";

import { useAuth } from "@/hooks/useAuth";
import { useLoginRedirect } from "./hooks/useLoginRedirect";
import { LoginHeader } from "./components/LoginHeader";
import { FormularioLogin } from "./components/FormularioLogin";
import { BotaoGoogle } from "./components/BotaoGoogle";
import { CtaInstalarApp } from "./components/CtaInstalarApp";
import styles from "./login.module.css";

const LoginPage = () => {
  const { firebaseUser, loading } = useAuth();
  const { pronto } = useLoginRedirect({ firebaseUser, loading });

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

        {/* Card principal do login */}
        <div className={styles.card}>
          <div className={styles.cardEdge} />
          <FormularioLogin desabilitado={loading} />

          {/* Divisor slit cutout */}
          <div className={styles.divisor}>
            <div className={styles.divisorLinha} />
            <span className={styles.divisorLabel}>ou conecte-se com</span>
          </div>

          <BotaoGoogle desabilitado={loading} />
        </div>

        <CtaInstalarApp />
      </div>
    </main>
  );
};

export default LoginPage;
