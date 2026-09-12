import type { TelemetriaMeusRoles } from "@/types/meus-roles";
import { CardStat } from "./CardStat";
import styles from "../meus-roles.module.css";

type Props = {
  telemetria: TelemetriaMeusRoles;
};

export const TelemetriaGaragem = ({ telemetria }: Props) => {
  return (
    <div className={styles.stats}>
      <CardStat
        rotulo="Ativos"
        valor={String(telemetria.ativos)}
        unidade="grupos"
        icone="sports_score"
        ariaLabel={`${telemetria.ativos} grupos ativos`}
        faixa="ciano"
      />
      <CardStat
        rotulo="Análise"
        valor={String(telemetria.analise)}
        unidade="pendente"
        icone="pending_actions"
        ariaLabel={`${telemetria.analise} pedidos em análise`}
        faixa="ambar"
      />
      <CardStat
        rotulo="Asfalto"
        valor={telemetria.asfaltoKm.toLocaleString("pt-BR")}
        unidade="km"
        icone="route"
        ariaLabel={`${telemetria.asfaltoKm} quilômetros de asfalto`}
        faixa="laranja"
      />
    </div>
  );
};
