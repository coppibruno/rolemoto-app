"use client";

import { useInstalacaoPwa } from "@/hooks/useInstalacaoPwa";
import { SheetInstalarIos } from "./SheetInstalarIos";
import styles from "../login.module.css";

export const CtaInstalarApp = () => {
  const pwa = useInstalacaoPwa();

  if (!pwa.mostrarCtaLogin) return null;

  return (
    <div className={styles.ctaInstalar}>
      <p className={styles.badgeInstalar}>
        <span className="material-symbols-outlined" aria-hidden>
          install_mobile
        </span>
        Instalável no celular
      </p>
      <button
        type="button"
        className={styles.botaoInstalar}
        onClick={() => void pwa.instalar()}
      >
        <span className="material-symbols-outlined" aria-hidden>
          add_to_home_screen
        </span>
        Adicionar à tela inicial
      </button>
      <button
        type="button"
        className={styles.linkAgoraNao}
        onClick={pwa.dispensar}
      >
        Agora não
      </button>
      {pwa.sheetAberto ? (
        <SheetInstalarIos onFechar={pwa.fecharSheet} />
      ) : null}
    </div>
  );
};
