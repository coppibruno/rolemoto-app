import type { MeuRoleItem } from "@/types/meus-roles";
import { CardAguardandoRole } from "./CardAguardandoRole";
import { CardConfirmadoRole } from "./CardConfirmadoRole";
import { CardConcluidoRole } from "./CardConcluidoRole";
import { CardDestaqueRole } from "./CardDestaqueRole";
import styles from "../meus-roles.module.css";

type Props = {
  itens: MeuRoleItem[];
  processandoId: string | null;
  onAcao: (item: MeuRoleItem, tipo: "desistir" | "cancelar") => void;
};

export const ListaMeusRoles = ({ itens, processandoId, onAcao }: Props) => {
  const primeiro = itens[0];
  const usaHero =
    primeiro && (primeiro.status === "confirmado" || primeiro.status === "lider");
  const resto = usaHero ? itens.slice(1) : itens;

  return (
    <div id="painel-meus-roles" role="tabpanel" className={styles.lista}>
      {usaHero ? (
        <CardDestaqueRole
          item={primeiro}
          processando={processandoId === primeiro.roleId}
          onDesistir={() => onAcao(primeiro, "desistir")}
        />
      ) : null}
      {resto.map((item) => {
        if (item.status === "pendente") {
          return (
            <CardAguardandoRole
              key={item.roleId}
              item={item}
              processando={processandoId === item.roleId}
              onCancelar={() => onAcao(item, "cancelar")}
            />
          );
        }
        if (item.status === "concluido") {
          return <CardConcluidoRole key={item.roleId} item={item} />;
        }
        return <CardConfirmadoRole key={item.roleId} item={item} />;
      })}
    </div>
  );
};
