import Link from "next/link";
import styles from "../../r/[id]/convite-role.module.css";

const ConviteLocalNaoEncontrado = () => {
  return (
    <main className={styles.naoEncontrado}>
      <span className={styles.logoNome}>
        ROLÊ<span className={styles.logoMoto}>MOTO</span>
      </span>
      <h1>Local não encontrado</h1>
      <p>Esse convite expirou ou o link está incompleto.</p>
      <div className={styles.naoEncontradoLinks}>
        <Link href="/login">Entrar</Link>
        <Link href="/">Ir ao início</Link>
      </div>
    </main>
  );
};

export default ConviteLocalNaoEncontrado;
