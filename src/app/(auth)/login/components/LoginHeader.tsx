"use client";

import { LogoRolemoto } from "@/components/marca/LogoRolemoto";
import { BotaoTema } from "@/components/tema/BotaoTema";
import styles from "../login.module.css";

export const LoginHeader = () => (
  <div className={styles.header}>
    <div className={styles.cantoTema}>
      <BotaoTema />
    </div>
    <div className={styles.logoContainer}>
      <LogoRolemoto width={240} height={80} className={styles.logo} priority />
    </div>
  </div>
);
