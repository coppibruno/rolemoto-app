import Link from "next/link";
import type { MeuRoleItem } from "@/types/meus-roles";
import { BotaoCompartilharRole } from "@/app/(app)/feed/components/BotaoCompartilharRole";
import { hrefMeuRole } from "../constants";
import { dadosConviteDe, formatarPedidoRelativo } from "../formatar-meus-roles";
import styles from "../meus-roles.module.css";

type Props = {
  item: MeuRoleItem;
  processando: boolean;
  onCancelar: () => void;
};

export const CardAguardandoRole = ({ item, processando, onCancelar }: Props) => {
  const destino = hrefMeuRole(item);
  const quando = item.pedidoCriadoEm
    ? formatarPedidoRelativo(item.pedidoCriadoEm)
    : "";

  return (
    <article className={`${styles.card} ${styles.cardAguardando}`}>
      <div className={styles.glowAmbar} aria-hidden />
      <div className={styles.cardTopo}>
        <span className={styles.pillPendente}>
          <span className="material-symbols-outlined">hourglass_top</span>
          Solicitação Pendente
        </span>
        {quando ? <span className={styles.cardData}>{quando}</span> : null}
      </div>
      <Link href={destino} className={styles.cardTituloLink}>
        <h2 className={styles.cardTitulo}>{item.titulo}</h2>
        <p className={styles.cardMeta}>
          Organizado por <strong>@{item.criador.apelido}</strong>
        </p>
      </Link>
      <div className={styles.boxContexto}>
        <div>
          <p className={styles.boxTitulo}>Aguardando o piloto líder</p>
          <p className={styles.boxTexto}>
            Você receberá um alerta quando @{item.criador.apelido} decidir.
          </p>
        </div>
        <span className={styles.chipTriagem}>Triagem</span>
      </div>
      <p className={styles.notaAmigavel}>
        O líder está avaliando seu pedido. Você recebe um aviso quando a vaga for
        validada.
      </p>
      <div className={styles.cardAcoes}>
        <button
          type="button"
          className={styles.botaoCancelar}
          onClick={onCancelar}
          disabled={processando}
        >
          Cancelar Solicitação
        </button>
        <BotaoCompartilharRole dados={dadosConviteDe(item)} />
      </div>
    </article>
  );
};
