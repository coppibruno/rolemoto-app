"use client";

import type {
  AbaHistoricoPublico,
  HistoricoPublico as HistoricoPublicoDto,
} from "@/types/perfil-publico";
import type { ItemHistoricoPista } from "@/types/historico-pistas";
import {
  ABAS_HISTORICO_PUBLICO,
  ariaBadgeAba,
  textoTotalRoles,
  totalRolesHistorico,
  VAZIOS_HISTORICO_PUBLICO,
} from "../constants";
import { CardHistoricoPublico } from "./CardHistoricoPublico";
import styles from "../perfil-publico.module.css";

type Props = {
  historico: HistoricoPublicoDto | null;
  aba: AbaHistoricoPublico;
  itens: ItemHistoricoPista[];
  carregando: boolean;
  erro: string | null;
  onAba: (aba: AbaHistoricoPublico) => void;
};

export const HistoricoPublicoSecao = ({
  historico,
  aba,
  itens,
  carregando,
  erro,
  onAba,
}: Props) => {
  const contagens = historico?.contagens ?? { concluidos: 0, comoLider: 0 };
  const total = totalRolesHistorico(contagens.concluidos, contagens.comoLider);
  const vazio = VAZIOS_HISTORICO_PUBLICO[aba];
  const abaAtual = ABAS_HISTORICO_PUBLICO.find((a) => a.id === aba);

  return (
    <section className={styles.secao} aria-labelledby="historico-publico-titulo">
      <div className={styles.secaoCabecalho}>
        <div className={styles.secaoTituloLinha}>
          <span className="material-symbols-outlined" aria-hidden>
            history_edu
          </span>
          <h2 id="historico-publico-titulo" className={styles.secaoTitulo}>
            Histórico de Rodagem
          </h2>
        </div>
        {!carregando && !erro ? (
          <span className={styles.totalRoles}>{textoTotalRoles(total)}</span>
        ) : null}
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Filtro do histórico">
        {ABAS_HISTORICO_PUBLICO.map((def) => {
          const n =
            def.id === "concluidos"
              ? contagens.concluidos
              : contagens.comoLider;
          const ativa = aba === def.id;
          return (
            <button
              key={def.id}
              type="button"
              role="tab"
              aria-selected={ativa}
              aria-label={ariaBadgeAba(def.label, n)}
              className={`${styles.tab} ${ativa ? styles.tabAtiva : ""}`}
              onClick={() => onAba(def.id)}
            >
              {def.label} ({n})
            </button>
          );
        })}
      </div>

      {carregando ? (
        <div className={styles.lista} aria-busy="true">
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : erro ? (
        <div className={styles.estado} role="alert">
          <span className={`material-symbols-outlined ${styles.estadoIcone}`}>
            cloud_off
          </span>
          <p className={styles.estadoTitulo}>Falha no histórico</p>
          <p className={styles.estadoCorpo}>{erro}</p>
        </div>
      ) : itens.length === 0 ? (
        <div className={styles.estado}>
          <span className={`material-symbols-outlined ${styles.estadoIcone}`}>
            {vazio.icone}
          </span>
          <p className={styles.estadoTitulo}>{vazio.titulo}</p>
          <p className={styles.estadoCorpo}>{vazio.corpo}</p>
        </div>
      ) : (
        <div
          className={styles.lista}
          role="tabpanel"
          aria-label={abaAtual?.listaAria}
        >
          {itens.map((item) => (
            <CardHistoricoPublico key={`${aba}-${item.roleId}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
};
