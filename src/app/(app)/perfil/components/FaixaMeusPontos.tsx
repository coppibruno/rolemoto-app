import Link from "next/link";
import styles from "../perfil.module.css";

type Props = {
  locais: { id: string; nome: string }[];
};

export const FaixaMeusPontos = ({ locais }: Props) => {
  if (locais.length === 0) return null;

  return (
    <section className={styles.meusPontos} aria-labelledby="titulo-meus-pontos">
      <h2 id="titulo-meus-pontos" className={styles.meusPontosTitulo}>
        Meus pontos
      </h2>
      <ul className={styles.meusPontosLista}>
        {locais.map((local) => (
          <li key={local.id}>
            <Link href={`/locais/${local.id}/balcao`} className={styles.meusPontosLinha}>
              <span className="material-symbols-outlined" aria-hidden>
                storefront
              </span>
              <span className={styles.meusPontosNome}>{local.nome}</span>
              <span className="material-symbols-outlined" aria-hidden>
                chevron_right
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
