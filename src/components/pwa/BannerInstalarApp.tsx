"use client";

import { usePathname } from "next/navigation";
import { useInstalacaoPwa } from "@/hooks/useInstalacaoPwa";
import { SheetInstalarIos } from "@/app/(auth)/login/components/SheetInstalarIos";
import styles from "./banner-instalar.module.css";

type Props = {
  variante?: "fixo" | "fluxo";
};

const rotaSemBanner = (pathname: string) =>
  pathname === "/perfil" || pathname.startsWith("/perfil/");

export const BannerInstalarApp = ({ variante = "fixo" }: Props) => {
  const pathname = usePathname();
  const pwa = useInstalacaoPwa();

  if (!pwa.mostrarBannerApp) return null;
  if (variante === "fixo" && rotaSemBanner(pathname)) return null;

  return (
    <>
      <div
        className={variante === "fixo" ? styles.fixo : styles.fluxo}
        data-banner-pwa
        role="region"
        aria-label="Instalar aplicativo"
      >
        <button
          type="button"
          className={styles.acao}
          onClick={() => void pwa.instalar()}
        >
          <span className="material-symbols-outlined" aria-hidden>
            add_to_home_screen
          </span>
          Adicionar à tela inicial
        </button>
        <button
          type="button"
          className={styles.dispensar}
          onClick={pwa.dispensar}
        >
          Agora não
        </button>
      </div>
      {pwa.sheetAberto ? (
        <SheetInstalarIos onFechar={pwa.fecharSheet} />
      ) : null}
    </>
  );
};
