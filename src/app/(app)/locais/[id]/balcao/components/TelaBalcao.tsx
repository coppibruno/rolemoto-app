"use client";

import Link from "next/link";
import { CabecalhoOfertas } from "../../components/CabecalhoOfertas";
import { useBalcao } from "../hooks/useBalcao";
import { CartaoOfertaBalcao } from "./CartaoOfertaBalcao";
import { SemanaBalcao } from "./SemanaBalcao";
import styles from "../../ofertas.module.css";

type Props = {
  localId: string;
};

export const TelaBalcao = ({ localId }: Props) => {
  const { balcao, carregando, erro, ocupadaId, alternarPausa, apagar } = useBalcao(localId);
  const hrefNova = `/locais/${localId}/ofertas/nova`;

  return (
    <div className={styles.tela}>
      <CabecalhoOfertas
        titulo="Balcão"
        hrefVoltar={`/locais/${localId}`}
        acao={{ href: hrefNova, icone: "add", label: "Nova oferta" }}
      />
      {carregando ? (
        <p className={styles.subtitulo} role="status">
          Carregando…
        </p>
      ) : null}
      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
      {balcao ? (
        <>
          <p className={styles.subtitulo}>{balcao.local.nome}</p>
          <SemanaBalcao semana={balcao.semana} />
          <section className={styles.bloco} aria-labelledby="titulo-ofertas-balcao">
            <h2 id="titulo-ofertas-balcao" className={styles.secao}>
              Ofertas
            </h2>
            {balcao.ofertas.length === 0 ? (
              <div className={styles.vazio}>
                <p>Nenhuma oferta ainda</p>
                <Link href={hrefNova} className={styles.cta}>
                  Nova oferta
                </Link>
              </div>
            ) : (
              <ul className={styles.lista}>
                {balcao.ofertas.map((oferta) => (
                  <CartaoOfertaBalcao
                    key={oferta.id}
                    localId={localId}
                    oferta={oferta}
                    ocupada={ocupadaId === oferta.id}
                    onAlternarPausa={(o) => void alternarPausa(o)}
                    onApagar={(o) => void apagar(o)}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};
