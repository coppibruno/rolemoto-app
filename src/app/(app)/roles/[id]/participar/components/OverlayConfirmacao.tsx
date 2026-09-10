"use client";

import type { ReactNode } from "react";
import { useFocoModal } from "@/app/(app)/feed/hooks/useFocoModal";
import styles from "../confirmacao-role.module.css";

type Props = {
  onFechar: () => void;
  children: ReactNode;
};

export const OverlayConfirmacao = ({ onFechar, children }: Props) => {
  const ref = useFocoModal(onFechar);

  return (
    <>
      <div
        className={styles.overlay}
        onClick={onFechar}
        aria-hidden="true"
      />
      <div ref={ref} className={styles.sheetWrap}>
        {children}
      </div>
    </>
  );
};
