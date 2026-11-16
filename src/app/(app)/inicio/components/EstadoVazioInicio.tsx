import Link from "next/link";
import styles from "../inicio.module.css";

type Props = {
  segueAlguem: boolean;
};

export const EstadoVazioInicio = ({ segueAlguem }: Props) => {
  if (segueAlguem) {
    return (
      <div className={styles.vazio} role="status">
        <p className={styles.vazioTexto}>Ninguém que você segue postou nada ainda.</p>
        <Link href="/explorar" className={styles.vazioLink}>
          Explorar rolês perto de você
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.vazio} role="status">
      <span className={styles.vazioIcone} aria-hidden>
        <span className="material-symbols-outlined">group</span>
      </span>
      <h2 className={styles.vazioTitulo}>Seu feed começa aqui</h2>
      <p className={styles.vazioTexto}>
        Siga pilotos para ver os rolês, fotos e telemetrias deles.
      </p>
      <Link href="/pilotos" className={styles.vazioCta}>
        Encontrar pilotos
      </Link>
      <Link href="/explorar" className={styles.vazioLink}>
        Explorar rolês perto de você
      </Link>
    </div>
  );
};
