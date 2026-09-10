"use client";

import type { StatusAprovacao } from "@/types/aprovacao";
import type { ChipRole } from "../hooks/useFilaAprovacoes";
import { ChipFiltro } from "./ChipFiltro";
import styles from "../aprovacoes.module.css";

type Props = {
  status: StatusAprovacao;
  roleId: string | null;
  pendentes: number;
  aceitos: number;
  chipsRole: ChipRole[];
  onStatus: (status: StatusAprovacao) => void;
  onRole: (roleId: string | null) => void;
};

export const FiltrosAprovacoes = ({
  status,
  roleId,
  pendentes,
  aceitos,
  chipsRole,
  onStatus,
  onRole,
}: Props) => {
  const filaAtiva = status === "pendente" && !roleId;
  const confirmadosAtivo = status === "aceito" && !roleId;

  return (
    <div className={styles.chips} role="tablist" aria-label="Filtros da fila">
      <ChipFiltro
        ativo={filaAtiva}
        icone="filter_list"
        label={`Fila (${pendentes})`}
        onClick={() => {
          onStatus("pendente");
          onRole(null);
        }}
      />
      {chipsRole.map((chip) => (
        <ChipFiltro
          key={chip.id}
          ativo={roleId === chip.id}
          bolinha
          label={`${chip.titulo} (${chip.count})`}
          onClick={() => onRole(chip.id)}
        />
      ))}
      <ChipFiltro
        ativo={confirmadosAtivo}
        icone="task_alt"
        label={`Confirmados (${aceitos})`}
        onClick={() => {
          onStatus("aceito");
          onRole(null);
        }}
      />
    </div>
  );
};
