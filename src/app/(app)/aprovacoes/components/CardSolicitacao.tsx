"use client";

import type { DecisaoPiloto, SolicitacaoLider } from "@/types/aprovacao";
import { AcoesSolicitacao } from "./AcoesSolicitacao";
import { AlertaRitmo } from "./AlertaRitmo";
import { BadgePilotagem } from "./BadgePilotagem";
import { FaixaRoleCard } from "./FaixaRoleCard";
import { IdentidadePiloto } from "./IdentidadePiloto";
import styles from "../aprovacoes.module.css";

type Props = {
  item: SolicitacaoLider;
  decidindo: boolean;
  saindo: "direita" | "esquerda" | null;
  onDecidir: (item: SolicitacaoLider, decisao: DecisaoPiloto) => void;
};

const classeSaindo = (saindo: Props["saindo"]) => {
  if (saindo === "direita") return styles.cardSaindoAceite;
  if (saindo === "esquerda") return styles.cardSaindoRecusa;
  return "";
};

export const CardSolicitacao = ({
  item,
  decidindo,
  saindo,
  onDecidir,
}: Props) => {
  return (
    <article className={`${styles.card} ${classeSaindo(saindo)}`}>
      <FaixaRoleCard role={item.role} />
      <IdentidadePiloto usuario={item.usuario} />
      <BadgePilotagem pilotagem={item.usuario.pilotagem} />
      <AlertaRitmo
        visivel={item.divergenciaRitmo}
        ritmo={item.role.ritmo}
      />
      <AcoesSolicitacao
        nome={item.usuario.nome}
        titulo={item.role.titulo}
        decidindo={decidindo}
        onRecusar={() => onDecidir(item, "recusar")}
        onAceitar={() => onDecidir(item, "aceitar")}
      />
    </article>
  );
};
