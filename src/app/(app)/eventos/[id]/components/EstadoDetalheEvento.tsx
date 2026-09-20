import Link from "next/link";
import { CTA_VOLTAR_FEED, VAZIO_CORPO, VAZIO_TITULO } from "../constants";
import styles from "../evento-detalhe.module.css";

export const EstadoCarregandoEvento = () => (
  <main className={styles.tela} aria-busy="true">
    <div className={styles.estado}>
      <p className={styles.estadoTexto}>Carregando evento…</p>
    </div>
  </main>
);

type Props = {
  mensagem?: string | null;
};

export const EstadoVazioEvento = ({ mensagem }: Props) => (
  <main className={styles.tela}>
    <div className={styles.estado}>
      <span className="material-symbols-outlined" aria-hidden>
        cloud_off
      </span>
      <h1 className={styles.estadoTitulo}>{VAZIO_TITULO}</h1>
      <p className={styles.estadoTexto}>{mensagem ?? VAZIO_CORPO}</p>
      <Link href="/" className={styles.linkFeed}>
        {CTA_VOLTAR_FEED}
      </Link>
    </div>
  </main>
);
