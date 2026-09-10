"use client";

import { CabecalhoFeed } from "@/app/(app)/feed/components/CabecalhoFeed";
import { useDecisaoPiloto } from "../hooks/useDecisaoPiloto";
import { useFilaAprovacoes } from "../hooks/useFilaAprovacoes";
import { EstadoCarregando } from "./EstadoCarregando";
import { EstadoVazio } from "./EstadoVazio";
import { FiltrosAprovacoes } from "./FiltrosAprovacoes";
import { HudAprovacoes } from "./HudAprovacoes";
import { ListaSolicitacoes } from "./ListaSolicitacoes";
import { ToastDecisao } from "./ToastDecisao";
import styles from "../aprovacoes.module.css";

export const TelaAprovacoes = () => {
  const fila = useFilaAprovacoes();
  const decisao = useDecisaoPiloto({ onDecidido: fila.aplicarDecisao });

  const vazio =
    !fila.carregando && !fila.erro && fila.itens.length === 0;

  return (
    <div className={styles.tela}>
      <CabecalhoFeed />
      <div className={styles.corpo}>
        <HudAprovacoes resumo={fila.resumo} />
        <FiltrosAprovacoes
          status={fila.status}
          roleId={fila.roleId}
          pendentes={fila.resumo.pendentes}
          aceitos={fila.resumo.aceitos}
          chipsRole={fila.chipsRole}
          onStatus={fila.setStatus}
          onRole={fila.setRoleId}
        />

        {fila.erro ? (
          <div className={styles.erro} role="alert">
            <span className="material-symbols-outlined">wifi_off</span>
            <p className={styles.erroTitulo}>{fila.erro}</p>
            <button
              type="button"
              className={styles.botaoTentar}
              onClick={fila.recarregar}
            >
              Tentar de novo
            </button>
          </div>
        ) : null}

        {fila.carregando ? <EstadoCarregando /> : null}

        {vazio ? (
          <EstadoVazio status={fila.status} resumo={fila.resumo} />
        ) : null}

        {!fila.carregando && !fila.erro && fila.itens.length > 0 ? (
          <ListaSolicitacoes
            status={fila.status}
            itens={fila.itens}
            decidindoId={decisao.decidindoId}
            saindo={decisao.saindo}
            onDecidir={decisao.decidir}
          />
        ) : null}
      </div>

      <ToastDecisao toast={decisao.toast} onFechar={decisao.fecharToast} />
    </div>
  );
};
