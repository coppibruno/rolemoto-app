"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import styles from "./banner-abrir-app-ios.module.css";

const iosForaDoApp = (): boolean => {
  if (Capacitor.isNativePlatform()) return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const BannerAbrirAppIosCliente = () => {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    setVisivel(iosForaDoApp());
  }, []);

  if (!visivel) return null;

  const abrir = () => {
    const caminho = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(`rolemoto://www.rolemoto.com.br${caminho}`);
  };

  return (
    <div className={styles.faixa}>
      <button type="button" className={styles.botao} onClick={abrir}>
        <span className="material-symbols-outlined" aria-hidden>
          phone_iphone
        </span>
        Abrir no aplicativo
      </button>
    </div>
  );
};
