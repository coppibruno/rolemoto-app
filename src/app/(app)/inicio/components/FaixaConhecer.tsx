"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BotaoSeguir } from "@/app/(app)/seguir/components/BotaoSeguir";
import { usePontoSugestao } from "@/app/(app)/pilotos/hooks/usePontoSugestao";
import { useSugestoesPilotos } from "@/app/(app)/pilotos/hooks/useSugestoesPilotos";
import { faixaOcultaHoje, ocultarFaixaHoje, ymdSaoPauloAgora } from "../faixa-sugestao";
import styles from "./faixa-conhecer.module.css";

export const FaixaConhecer = () => {
  const local = usePontoSugestao();
  const sugestoes = useSugestoesPilotos(local.ponto, local.pronto);
  const [fechada, setFechada] = useState<boolean | null>(null);
  const visiveis = sugestoes.itens.slice(0, 3);

  useEffect(() => {
    setFechada(faixaOcultaHoje(ymdSaoPauloAgora()));
  }, []);

  if (fechada !== false || !local.pronto || sugestoes.fase !== "ok" || visiveis.length === 0) {
    return null;
  }

  const fechar = () => {
    ocultarFaixaHoje(ymdSaoPauloAgora());
    setFechada(true);
  };

  return (
    <section className={styles.faixa} aria-label="Conhecer">
      <div className={styles.topo}>
        <h2 className={styles.titulo}>Conhecer</h2>
        <div className={styles.topoAcoes}>
          <Link href="/pilotos" className={styles.verMais}>
            Ver mais
          </Link>
          <button type="button" className={styles.fechar} aria-label="Agora não" onClick={fechar}>
            <span className="material-symbols-outlined" aria-hidden>
              close
            </span>
          </button>
        </div>
      </div>
      <ul className={styles.carrossel}>
        {visiveis.map((pessoa) => (
          <li key={pessoa.uid} className={styles.card}>
            <Link href={`/perfil/${pessoa.uid}`} className={styles.pessoa}>
              {pessoa.fotoUrl ? (
                <img src={pessoa.fotoUrl} alt="" className={styles.foto} referrerPolicy="no-referrer" />
              ) : (
                <span className={styles.fotoVazia} aria-hidden>
                  <span className="material-symbols-outlined">person</span>
                </span>
              )}
              <span className={styles.nome}>{pessoa.nome}</span>
              <span className={styles.motivo}>{pessoa.motivo.texto}</span>
            </Link>
            <div className={styles.acao}>
              <BotaoSeguir
                uid={pessoa.uid}
                apelido={pessoa.apelido}
                seguido={false}
                onSeguiu={() => sugestoes.remover(pessoa.uid)}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
