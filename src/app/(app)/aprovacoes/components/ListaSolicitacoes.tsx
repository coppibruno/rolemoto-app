"use client";

import type { DecisaoPiloto, SolicitacaoLider, StatusAprovacao } from "@/types/aprovacao";
import type { SaindoCard } from "../hooks/useDecisaoPiloto";
import { CardConfirmado } from "./CardConfirmado";
import { CardSolicitacao } from "./CardSolicitacao";
import styles from "../aprovacoes.module.css";

type Props = {
  status: StatusAprovacao;
  itens: SolicitacaoLider[];
  decidindoId: string | null;
  saindo: SaindoCard | null;
  onDecidir: (item: SolicitacaoLider, decisao: DecisaoPiloto) => void;
};

export const ListaSolicitacoes = ({
  status,
  itens,
  decidindoId,
  saindo,
  onDecidir,
}: Props) => {
  const label =
    status === "aceito"
      ? "Pilotos confirmados"
      : "Fila de aprovação de pilotos";

  return (
    <section className={styles.lista} aria-label={label}>
      {itens.map((item) =>
        status === "aceito" ? (
          <CardConfirmado key={item.id} item={item} />
        ) : (
          <CardSolicitacao
            key={item.id}
            item={item}
            decidindo={decidindoId === item.id}
            saindo={saindo?.id === item.id ? saindo.lado : null}
            onDecidir={onDecidir}
          />
        ),
      )}
    </section>
  );
};
