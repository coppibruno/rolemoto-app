"use client";

import { useInstalacaoPwa } from "@/hooks/useInstalacaoPwa";
import { SheetInstalarIos } from "@/app/(auth)/login/components/SheetInstalarIos";
import styles from "../perfil.module.css";

export const BotaoInstalarApp = () => {
  const pwa = useInstalacaoPwa();

  if (!pwa.mostrarItemPerfil) return null;

  return (
    <>
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
      {pwa.sheetAberto ? (
        <SheetInstalarIos onFechar={pwa.fecharSheet} />
      ) : null}
    </>
  );
};
