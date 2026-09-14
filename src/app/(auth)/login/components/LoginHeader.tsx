"use client";

import Image from "next/image";
import styles from "../login.module.css";

export const LoginHeader = () => (
  <div className={styles.header}>
    <div className={styles.ambientGlow} />

    <div className={styles.logoContainer}>
      <Image
        src="/logo-rolemoto.jpeg"
        alt="Rolê Moto — Comunidade em duas rodas"
        width={240}
        height={80}
        className={styles.logo}
        priority
      />
    </div>
  </div>
);
