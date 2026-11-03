"use client";

import { useAuth } from "@/hooks/useAuth";
import { useListaLocais } from "../hooks/useListaLocais";
import { CabecalhoLocais } from "./CabecalhoLocais";
import { EstadoCarregandoLocais } from "./EstadoCarregandoLocais";
import { EstadoVazioLocais } from "./EstadoVazioLocais";
import { ListaLocais } from "./ListaLocais";
import styles from "../locais.module.css";

export const TelaLocais = () => {
  const { usuario } = useAuth();
  const { itens, carregando, erro, recarregar } = useListaLocais();
  const admin = usuario?.admin === true;
  const esperando = carregando && itens.length === 0;

  return (
    <div className={styles.tela}>
      <CabecalhoLocais admin={admin} />
      {esperando ? <EstadoCarregandoLocais /> : null}
      {!esperando && erro ? (
        <div className={styles.erro} role="alert">
          <span className="material-symbols-outlined">cloud_off</span>
          <p className={styles.erroTitulo}>{erro}</p>
          <button type="button" className={styles.botaoTentar} onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {!esperando && !erro && itens.length === 0 ? (
        <EstadoVazioLocais admin={admin} />
      ) : null}
      {!erro && itens.length > 0 ? <ListaLocais itens={itens} /> : null}
    </div>
  );
};
