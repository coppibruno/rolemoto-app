import Link from "next/link";
import type { MeuRoleItem } from "@/types/meus-roles";
import { BotaoCompartilharRole } from "@/app/(app)/feed/components/BotaoCompartilharRole";
import { formatarHora, formatarHorarioSaida } from "@/app/(app)/feed/formatar-horario";
import { hrefMeuRole, saidaFutura } from "../constants";
import { dadosConviteDe, tituloSaidaMeuRole } from "../formatar-meus-roles";
import { AcoesOrganizadorRole } from "./AcoesOrganizadorRole";
import styles from "../meus-roles.module.css";

type Props = {
  item: MeuRoleItem;
  cancelando?: boolean;
  onCancelarRole?: () => void;
};

export const CardConfirmadoRole = ({ item, cancelando, onCancelarRole }: Props) => {
  const extras = Math.max(0, item.participantes.confirmados - item.participantes.destaques.length);
  const destino = hrefMeuRole(item);

  return (
    <article className={styles.card}>
      <div className={styles.cardTopo}>
        <span className={styles.badgeAssegurada}>
          <span className={styles.bolinhaCiano} aria-hidden />
          {item.status === "lider" ? "Organizador" : "Vaga Assegurada"}
        </span>
        <span className={styles.cardData}>{formatarHorarioSaida(item.dataHoraSaida)}</span>
      </div>
      <Link href={destino} className={styles.cardTituloLink}>
        <h2 className={styles.cardTitulo}>{item.titulo}</h2>
        <p className={styles.cardMeta}>
          {tituloSaidaMeuRole(item)} · {formatarHora(item.dataHoraSaida)}
        </p>
      </Link>
      <div className={styles.cardRodape}>
        <div className={styles.avatares}>
          {item.participantes.destaques.map((d, i) =>
            d.fotoUrl ? (
              <img key={`${d.iniciais}-${i}`} src={d.fotoUrl} alt="" className={styles.avatarMini} />
            ) : (
              <span key={`${d.iniciais}-${i}`} className={styles.avatarMiniIniciais}>
                {d.iniciais}
              </span>
            ),
          )}
          {extras > 0 ? (
            <span className={styles.avatarMais} aria-label={`mais ${extras} pilotos`}>
              +{extras}
            </span>
          ) : null}
          <span className={styles.confirmadosN}>
            {item.participantes.confirmados} confirmados
          </span>
        </div>
        <div className={styles.cardAcoes}>
          <Link href={destino} className={styles.botaoAcessar}>
            Acessar
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>
          <BotaoCompartilharRole dados={dadosConviteDe(item)} />
        </div>
      </div>
      {item.status === "lider" && saidaFutura(item.dataHoraSaida) && onCancelarRole ? (
        <AcoesOrganizadorRole
          roleId={item.roleId}
          titulo={item.titulo}
          cancelando={Boolean(cancelando)}
          onCancelar={onCancelarRole}
        />
      ) : null}
    </article>
  );
};
