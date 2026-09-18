import Link from "next/link";
import styles from "./evento-detalhe.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

const EventoDetalhePage = async ({ params }: Props) => {
  const { id } = await params;

  return (
    <main className={styles.tela}>
      <div className={styles.card}>
        <span className={`material-symbols-outlined ${styles.icone}`} aria-hidden>
          local_activity
        </span>
        <h1 className={styles.titulo}>Detalhe do evento</h1>
        <p className={styles.texto}>
          Em breve você verá aqui as informações completas deste encontro.
        </p>
        <p className={styles.id} aria-hidden>
          #{id}
        </p>
        <Link href="/" className={styles.link}>
          Voltar ao Feed
        </Link>
      </div>
    </main>
  );
};

export default EventoDetalhePage;
