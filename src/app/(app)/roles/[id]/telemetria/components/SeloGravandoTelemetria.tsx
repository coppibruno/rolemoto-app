"use client";

import { COPY_TELEMETRIA } from "../constants";
import { useSessaoTelemetriaNativa } from "../hooks/useSessaoTelemetriaNativa";
import styles from "../telemetria-role.module.css";

type Props = {
  roleId: string;
  destaque?: boolean;
};

export const SeloGravandoTelemetria = ({ roleId, destaque }: Props) => {
  const { sessaoDesteRole } = useSessaoTelemetriaNativa(roleId);
  if (!sessaoDesteRole) return null;

  return (
    <span className={destaque ? `${styles.selo} ${styles.seloHero}` : styles.selo}>
      <span className={styles.pulso} aria-hidden />
      {COPY_TELEMETRIA.gravando}
    </span>
  );
};
