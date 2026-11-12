"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import type { CupomOferta, OfertaLocal } from "@/types/oferta-local";
import { CUPOM_INSTRUCAO } from "../constants";
import styles from "../ofertas.module.css";

type Props = {
  oferta: OfertaLocal;
  cupom: CupomOferta | null;
  erro: string | null;
  onFechar: () => void;
};

export const FolhaCupom = ({ oferta, cupom, erro, onFechar }: Props) => {
  const folhaRef = useFocoModal(onFechar);

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        ref={folhaRef}
        className={styles.folha}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-folha-cupom"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.grip} aria-hidden />
        <p className={styles.folhaInstrucao}>{CUPOM_INSTRUCAO}</p>
        <h2 id="titulo-folha-cupom" className={styles.folhaTitulo}>
          {oferta.titulo} · {oferta.rotulo}
        </h2>
        {cupom ? (
          <>
            <p className={styles.folhaCodigo} aria-label={`Código ${cupom.codigo}`}>
              {cupom.codigo}
            </p>
            <p className={styles.folhaPiloto}>{cupom.piloto.nome}</p>
            {cupom.piloto.moto ? <p className={styles.folhaMoto}>{cupom.piloto.moto}</p> : null}
            <p className={styles.folhaRegra}>{cupom.regra}</p>
            {cupom.tetoDia ? (
              <p className={styles.folhaTeto}>Até {cupom.tetoDia} por dia</p>
            ) : null}
          </>
        ) : erro ? (
          <p className={styles.erro} role="alert">
            {erro}
          </p>
        ) : (
          <p className={styles.folhaCarregando} role="status">
            Abrindo cupom…
          </p>
        )}
        <button
          type="button"
          className={styles.botaoSecundario}
          onClick={onFechar}
          data-foco-inicial
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
