"use client";

import type { FacetaBusca } from "@/types/sugestao-local";
import { FiltroBuscaSugestoes } from "./FiltroBuscaSugestoes";
import styles from "../sugestoes-locais.module.css";

type Props = {
  buscando: boolean;
  resumo: string | null;
  erro: string | null;
  facetas: FacetaBusca[];
  onAlternarFaceta: (faceta: FacetaBusca) => void;
  onBuscar: () => void;
};

export const IntroSugestoesLocais = ({
  buscando,
  resumo,
  erro,
  facetas,
  onAlternarFaceta,
  onBuscar,
}: Props) => {
  return (
    <div className={styles.intro}>
      <span className={styles.badgeAdmin}>
        <span className={styles.pontoPulse} aria-hidden />
        Painel Admin
      </span>
      <h2 className={styles.introTitulo}>Sugestões de locais</h2>
      <p className={styles.introSubtitulo}>
        Pontos perto das rotas do Sul. Homologar publica no catálogo.
      </p>
      <FiltroBuscaSugestoes
        facetas={facetas}
        desabilitado={buscando}
        onAlternar={onAlternarFaceta}
      />
      <button type="button" className={styles.buscar} onClick={onBuscar} disabled={buscando}>
        {buscando ? "Buscando…" : "Buscar agora"}
      </button>
      <p className={styles.dica}>
        A rodada usa quatro rotas. Ponto turístico procura a serra. Mirante procura o
        mirante.
      </p>
      {resumo ? (
        <p className={styles.resumo} role="status">
          {resumo}
        </p>
      ) : null}
      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
