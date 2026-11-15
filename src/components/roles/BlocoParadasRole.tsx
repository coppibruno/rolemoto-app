import Link from "next/link";
import { tituloLocal } from "@/lib/localizacao";
import type { Localizacao } from "@/types/role";
import styles from "./bloco-paradas-role.module.css";

type Props = {
  roleId?: string;
  paradas: Localizacao[];
  comRotulo?: boolean;
};

export const hrefMapaViagem = (roleId: string): string =>
  `/roles/${encodeURIComponent(roleId)}/mapa`;

/** Lista só leitura das paradas; com `roleId`, leva ao Mapa da viagem. */
export const BlocoParadasRole = ({ roleId, paradas, comRotulo = true }: Props) => {
  if (paradas.length === 0 && !roleId) return null;

  return (
    <div className={styles.bloco}>
      {paradas.length > 0 ? (
        <>
          {comRotulo ? <span className={styles.rotulo}>Paradas</span> : null}
          <ol className={styles.lista}>
            {paradas.map((ponto, indice) => (
              <li key={`${indice}-${ponto.lat}-${ponto.lng}`} className={styles.item}>
                <span className={styles.numero} aria-hidden>
                  {indice + 1}
                </span>
                <span className={styles.nome}>{tituloLocal(ponto)}</span>
              </li>
            ))}
          </ol>
        </>
      ) : null}
      {roleId ? (
        <Link href={hrefMapaViagem(roleId)} className={styles.link}>
          <span className="material-symbols-outlined" aria-hidden>
            map
          </span>
          Mapa da viagem
        </Link>
      ) : null}
    </div>
  );
};
