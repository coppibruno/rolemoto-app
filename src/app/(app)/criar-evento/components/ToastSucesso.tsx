import { TOAST_SUBTITULO, TOAST_TITULO } from "../constants";
import styles from "../criar-evento.module.css";

type Props = {
  visivel: boolean;
};

export const ToastSucesso = ({ visivel }: Props) => {
  if (!visivel) return null;

  return (
    <div className={styles.toast} role="status">
      <div className={styles.toastIcone}>
        <span className="material-symbols-outlined">check_circle</span>
      </div>
      <div>
        <div className={styles.toastTitulo}>{TOAST_TITULO}</div>
        <div className={styles.toastSubtitulo}>{TOAST_SUBTITULO}</div>
      </div>
    </div>
  );
};
