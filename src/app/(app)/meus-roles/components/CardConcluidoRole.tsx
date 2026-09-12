import Link from "next/link";
import type { MeuRoleItem } from "@/types/meus-roles";
import { BotaoCompartilharRole } from "@/app/(app)/feed/components/BotaoCompartilharRole";
import { hrefClonarRole, hrefMeuRole } from "../constants";
import { dadosConviteDe, formatarDataConcluido, formatarKm } from "../formatar-meus-roles";
import styles from "../meus-roles.module.css";

type Props = {
  item: MeuRoleItem;
};

export const CardConcluidoRole = ({ item }: Props) => {
  const destino = hrefMeuRole(item);
  const organizador = item.papel === "organizador";

  return (
    <article className={styles.card}>
      <div className={styles.cardTopo}>
        <span className={styles.pillConcluido}>
          <span className="material-symbols-outlined">check_circle</span>
          Concluído
        </span>
        <span className={styles.cardData}>{formatarDataConcluido(item.dataHoraSaida)}</span>
      </div>
      <Link href={destino} className={styles.cardTituloLink}>
        <h2 className={styles.cardTitulo}>{item.titulo}</h2>
        <p className={styles.cardMeta}>{formatarKm(item.distanciaRotaKm)} rodados</p>
      </Link>
      <div className={styles.cardAcoes}>
        {organizador ? (
          <Link href={hrefClonarRole(item.roleId)} className={styles.botaoSecundario}>
            <span className="material-symbols-outlined">alt_route</span>
            Clonar Rota
          </Link>
        ) : (
          <Link href={destino} className={styles.botaoSecundario}>
            Acessar
          </Link>
        )}
        <BotaoCompartilharRole dados={dadosConviteDe(item)} />
      </div>
    </article>
  );
};
