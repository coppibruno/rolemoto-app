"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessaoTelemetriaNativa } from "../hooks/useSessaoTelemetriaNativa";
import styles from "@/components/telemetria/telemetria.module.css";

export const AvisoSessaoTelemetria = () => {
  const pathname = usePathname();
  const { sessao, resumoPendente, sincronizar } = useSessaoTelemetriaNativa();

  useEffect(() => {
    void sincronizar();
  }, [pathname, sincronizar]);

  if (pathname === "/gravar-role") return null;

  if (sessao) {
    return (
      <div className={styles.banner} role="status">
        <p className={styles.bannerTexto}>Gravação GPS em andamento</p>
        <Link href="/gravar-role" className={styles.bannerLink}>
          Abrir
        </Link>
      </div>
    );
  }

  if (!resumoPendente) return null;

  return (
    <div className={styles.banner} role="status">
      <p className={styles.bannerTexto}>Passeio ainda não enviado</p>
      <Link href="/gravar-role" className={styles.bannerLink}>
        Abrir
      </Link>
    </div>
  );
};
