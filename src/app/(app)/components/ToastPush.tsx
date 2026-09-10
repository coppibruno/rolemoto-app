"use client";

import { usePushForeground } from "../hooks/usePushForeground";
import styles from "../app.module.css";

export const ToastPush = () => {
  const { titulo } = usePushForeground();

  if (!titulo) {
    return null;
  }

  return (
    <div className={styles.toastPush} role="status">
      <span className="material-symbols-outlined" aria-hidden>
        notifications_active
      </span>
      <span className={styles.toastPushMsg}>{titulo}</span>
    </div>
  );
};
