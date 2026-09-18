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

  return (
    <div className={styles.tela}>
      <CabecalhoLocais admin={admin} />
      {carregando ? <EstadoCarregandoLocais /> : null}
      {!carregando && erro ? (
        <div className={styles.erro} role="alert">
          <span className="material-symbols-outlined">cloud_off</span>
          <p className={styles.erroTitulo}>{erro}</p>
          <button type="button" className={styles.botaoTentar} onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {!carregando && !erro && itens.length === 0 ? (
        <EstadoVazioLocais admin={admin} />
      ) : null}
      {!carregando && !erro && itens.length > 0 ? <ListaLocais itens={itens} /> : null}
    </div>
  );
};
