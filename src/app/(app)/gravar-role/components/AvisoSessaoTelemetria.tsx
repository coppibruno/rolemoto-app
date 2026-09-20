"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessaoTelemetriaNativa } from "../hooks/useSessaoTelemetriaNativa";
import styles from "@/components/telemetria/telemetria.module.css";

export const AvisoSessaoTelemetria = () => {
  const pathname = usePathname();
  const { sessao } = useSessaoTelemetriaNativa();

  if (!sessao) return null;
  if (pathname === "/gravar-role") return null;

  return (
    <div className={styles.banner} role="status">
      <p className={styles.bannerTexto}>Gravação GPS em andamento</p>
      <Link href="/gravar-role" className={styles.bannerLink}>
        Abrir
      </Link>
    </div>
  );
};
