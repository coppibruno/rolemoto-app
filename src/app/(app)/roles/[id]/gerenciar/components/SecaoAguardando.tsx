"use client";

import type { DecisaoPiloto, SolicitacaoLider } from "@/types/aprovacao";
import type { SaindoCard } from "@/app/(app)/aprovacoes/hooks/useDecisaoPiloto";
import { CardSolicitacao } from "@/app/(app)/aprovacoes/components/CardSolicitacao";
import { SECAO_AGUARDANDO, VAZIO_PENDENTES } from "../constants";
import styles from "../gerenciar-role.module.css";

type Props = {
  itens: SolicitacaoLider[];
  decidindoId: string | null;
  saindo: SaindoCard | null;
  onDecidir: (item: SolicitacaoLider, decisao: DecisaoPiloto) => void;
};

export const SecaoAguardando = ({
  itens,
  decidindoId,
  saindo,
  onDecidir,
}: Props) => {
  return (
    <section className={styles.secao} aria-label={SECAO_AGUARDANDO}>
      <div className={styles.secaoCabecalho}>
        <h3 className={styles.secaoTitulo}>
          {SECAO_AGUARDANDO}
          {itens.length > 0 ? ` (${itens.length})` : ""}
        </h3>
      </div>
      {itens.length === 0 ? (
        <p className={styles.vazio}>{VAZIO_PENDENTES}</p>
      ) : (
        <div className={styles.lista}>
          {itens.map((item) => (
            <CardSolicitacao
              key={item.id}
              item={item}
              decidindo={decidindoId === item.id}
              saindo={saindo?.id === item.id ? saindo.lado : null}
              onDecidir={onDecidir}
              ocultarFaixa
            />
          ))}
        </div>
      )}
    </section>
  );
};
