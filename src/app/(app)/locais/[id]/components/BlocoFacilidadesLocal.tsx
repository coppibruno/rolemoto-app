import { OPCOES_FACILIDADES } from "@/app/(app)/locais/constants";
import type { FacilidadeLocal } from "@/types/local";
import { TITULO_FACILIDADES } from "../constants";
import styles from "../local-detalhe.module.css";

type Props = {
  facilidades: FacilidadeLocal[];
};

export const BlocoFacilidadesLocal = ({ facilidades }: Props) => {
  const itens = facilidades
    .map((valor) => OPCOES_FACILIDADES.find((item) => item.valor === valor))
    .filter((item): item is (typeof OPCOES_FACILIDADES)[number] => Boolean(item));

  if (itens.length === 0) return null;

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitulo}>{TITULO_FACILIDADES}</h3>
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
