import Link from "next/link";
import { formatarVelocidadeConquista } from "@/lib/conquistas";
import type { ItemRanking } from "@/types/conquista";
import styles from "../ranking.module.css";

type Props = {
  item: ItemRanking;
};

export const LinhaPlacar = ({ item }: Props) => {
  const semPassagem = item.posicao === null;

  return (
    <Link
      href={item.eu ? "/perfil" : `/perfil/${encodeURIComponent(item.uid)}`}
      className={item.eu ? `${styles.linhaPlacar} ${styles.linhaEu}` : styles.linhaPlacar}
    >
      {semPassagem ? null : <span className={styles.posicao}>{item.posicao}</span>}
      {item.fotoUrl ? (
        <img src={item.fotoUrl} alt="" className={styles.foto} referrerPolicy="no-referrer" />
      ) : (
        <span className={styles.fotoVazia} aria-hidden>
          <span className="material-symbols-outlined">person</span>
        </span>
      )}
      <span className={styles.textosLinha}>
        <span className={styles.apelido}>{item.apelido}</span>
        {item.eu ? <span className={styles.voce}>Você</span> : null}
        {semPassagem ? (
          <span className={styles.semPassagem}>Você ainda não passou aqui</span>
        ) : null}
      </span>
      {typeof item.velocidadeMaxKmh === "number" ? (
        <span className={styles.velocidade}>
          {formatarVelocidadeConquista(item.velocidadeMaxKmh)}
        </span>
      ) : null}
    </Link>
  );
};
