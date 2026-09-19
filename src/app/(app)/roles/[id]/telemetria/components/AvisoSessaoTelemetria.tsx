"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COPY_TELEMETRIA } from "@/app/(app)/roles/[id]/telemetria/constants";
import { useSessaoTelemetriaNativa } from "@/app/(app)/roles/[id]/telemetria/hooks/useSessaoTelemetriaNativa";
import styles from "@/app/(app)/roles/[id]/telemetria/telemetria-role.module.css";

export const AvisoSessaoTelemetria = () => {
  const pathname = usePathname();
  const { sessao } = useSessaoTelemetriaNativa();

  if (!sessao) return null;
  if (pathname?.includes(`/roles/${sessao.roleId}`)) return null;

  return (
    <div className={styles.banner} role="status">
      <p className={styles.bannerTexto}>{COPY_TELEMETRIA.orfa}</p>
      <Link
        href={`/roles/${sessao.roleId}/participar`}
        className={styles.bannerLink}
      >
        Abrir
      </Link>
    </div>
  );
};
