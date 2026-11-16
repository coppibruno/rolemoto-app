"use client";

import { LinhaPiloto } from "@/app/(app)/seguir/components/LinhaPiloto";
import type { LinhaPiloto as Linha } from "@/types/seguir";
import type { FaseBusca } from "../hooks/useBuscaPilotos";
import styles from "../pilotos.module.css";

type Props = {
  fase: FaseBusca;
  itens: Linha[];
  onTentar: () => void;
};

export const BlocoSeguindo = ({ fase, itens, onTentar }: Props) => (
  <section className={styles.bloco}>
    <h2 className={styles.secao}>Seguindo</h2>
    {fase === "carregando" ? <p className={styles.aviso}>Buscando…</p> : null}
    {fase === "semSeguidos" ? (
      <p className={styles.aviso}>Você ainda não segue ninguém.</p>
    ) : null}
    {fase === "maisUmaLetra" ? (
      <p className={styles.aviso}>Digite mais uma letra para buscar todo mundo.</p>
    ) : null}
    {fase === "erro" ? (
      <div className={styles.erro}>
        <p>Não deu para buscar agora.</p>
        <button type="button" onClick={onTentar}>
          Tentar de novo
        </button>
      </div>
    ) : null}
    {fase === "ok" ? (
      <ul className={styles.lista}>
        {itens.map((pessoa) => (
          <li key={pessoa.uid}>
            <LinhaPiloto pessoa={pessoa} />
          </li>
        ))}
      </ul>
    ) : null}
  </section>
);
