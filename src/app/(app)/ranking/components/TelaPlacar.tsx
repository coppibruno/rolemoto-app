"use client";

import Link from "next/link";
import { usePlacarRanking } from "../hooks/usePlacarRanking";
import { CabecalhoRanking } from "./CabecalhoRanking";
import { LinhaPlacar } from "./LinhaPlacar";
import styles from "../ranking.module.css";

type Props = {
  conquistaId: string;
};

export const TelaPlacar = ({ conquistaId }: Props) => {
  const { placar, carregando, erro, naoEncontrado, recarregar } =
    usePlacarRanking(conquistaId);
  const comPosicao = placar?.itens.filter((i) => i.posicao !== null) ?? [];
  const semPosicao = placar?.itens.filter((i) => i.posicao === null) ?? [];

  return (
    <div className={styles.tela}>
      <CabecalhoRanking titulo={placar?.conquista.nome ?? "Ranking"} hrefVoltar="/ranking" />
      {carregando ? <p className={styles.aviso}>Carregando…</p> : null}
      {erro ? (
        <div className={styles.erro}>
          <p>{erro}</p>
          <button type="button" onClick={() => void recarregar()}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {naoEncontrado ? (
        <div className={styles.vazio}>
          <p>Este ponto não está no ranking</p>
          <Link href="/ranking">Ver pontos</Link>
        </div>
      ) : null}
      {placar && !carregando ? (
        <>
          {comPosicao.length > 0 ? (
            <ol className={styles.lista} aria-label={`Ranking de ${placar.conquista.nome}`}>
              {comPosicao.map((item) => (
                <li key={item.uid}>
                  <LinhaPlacar item={item} />
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.aviso}>Ninguém que você segue carimbou este ponto</p>
          )}
          {semPosicao.length > 0 ? (
            <>
              {comPosicao.length > 0 ? (
                <div className={styles.separador} role="presentation" />
              ) : null}
              <ul className={styles.lista}>
                {semPosicao.map((item) => (
                  <li key={item.uid}>
                    <LinhaPlacar item={item} />
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
