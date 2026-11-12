"use client";

import { TITULO_OFERTAS } from "../constants";
import { useCupomOferta } from "../hooks/useCupomOferta";
import { useOfertasLocal } from "../hooks/useOfertasLocal";
import { FolhaCupom } from "./FolhaCupom";
import { LinhaOferta } from "./LinhaOferta";
import styles from "../ofertas.module.css";

type Props = {
  localId: string;
};

export const BlocoOfertasLocal = ({ localId }: Props) => {
  const { ofertas, recarregar } = useOfertasLocal(localId);
  const folha = useCupomOferta({ localId, onForaDoAr: () => void recarregar() });

  if (ofertas.length === 0) return null;

  return (
    <section className={styles.bloco} aria-labelledby="titulo-ofertas-local">
      <h2 id="titulo-ofertas-local" className={styles.secao}>
        {TITULO_OFERTAS}
      </h2>
      <ul className={styles.lista}>
        {ofertas.map((oferta) => (
          <LinhaOferta key={oferta.id} oferta={oferta} onAbrir={(o) => void folha.abrir(o)} />
        ))}
      </ul>
      {folha.oferta ? (
        <FolhaCupom
          oferta={folha.oferta}
          cupom={folha.cupom}
          erro={folha.erro}
          onFechar={folha.fechar}
        />
      ) : null}
    </section>
  );
};
