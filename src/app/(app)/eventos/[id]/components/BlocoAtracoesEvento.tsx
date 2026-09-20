import { OPCOES_ATRACOES } from "@/app/(app)/criar-evento/constants";
import type { AtracaoEvento } from "@/types/evento";
import { TITULO_ATRACOES } from "../constants";
import styles from "../evento-detalhe.module.css";

type Props = {
  atracoes: AtracaoEvento[];
};

export const BlocoAtracoesEvento = ({ atracoes }: Props) => {
  const itens = atracoes
    .map((valor) => OPCOES_ATRACOES.find((item) => item.valor === valor))
    .filter((item): item is (typeof OPCOES_ATRACOES)[number] => Boolean(item));

  if (itens.length === 0) return null;

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitulo}>{TITULO_ATRACOES}</h3>
      <ul className={styles.lista}>
        {itens.map((item) => (
          <li key={item.valor} className={styles.itemLista}>
            <span className="material-symbols-outlined" aria-hidden>
              {item.icone}
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
};
