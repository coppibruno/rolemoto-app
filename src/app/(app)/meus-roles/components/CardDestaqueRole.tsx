import Link from "next/link";
import type { MeuRoleItem } from "@/types/meus-roles";
import { BotaoCompartilharRole } from "@/app/(app)/feed/components/BotaoCompartilharRole";
import { formatarHorarioSaida } from "@/app/(app)/feed/formatar-horario";
import { hrefMeuRole, LABELS_RITMO, saidaFutura } from "../constants";
import { dadosConviteDe, tituloSaidaMeuRole } from "../formatar-meus-roles";
import { AcoesOrganizadorRole } from "./AcoesOrganizadorRole";
import styles from "../meus-roles.module.css";

type Props = {
  item: MeuRoleItem;
  processando: boolean;
  onDesistir: () => void;
  onCancelarRole: () => void;
};

export const CardDestaqueRole = ({
  item,
  processando,
  onDesistir,
  onCancelarRole,
}: Props) => {
  const lider = item.status === "lider";
  const destino = hrefMeuRole(item);

  return (
    <article className={styles.heroCard}>
      <Link href={destino} className={styles.heroCapa}>
        {item.fotoCapaUrl ? (
          <img
            src={item.fotoCapaUrl}
            alt={`Capa do rolê ${item.titulo}`}
            className={styles.heroImg}
          />
        ) : (
          <div className={styles.heroPlaceholder} />
        )}
        <div className={styles.heroScrim} />
        <span className={lider ? styles.badgeLider : styles.badgeConfirmada}>
          {!lider ? <span className={styles.ping} aria-hidden /> : null}
          {lider ? "Líder do Comboio" : "Vaga Confirmada"}
        </span>
        <div className={styles.heroTituloWrap}>
          <h2 className={styles.heroTitulo}>{item.titulo}</h2>
          <p className={styles.heroData}>{formatarHorarioSaida(item.dataHoraSaida)}</p>
        </div>
      </Link>
      <div className={styles.heroCorpo}>
        <div className={styles.heroGrid}>
          <div>
            <span className={styles.metaRotulo}>Ponto de Encontro</span>
            <p className={styles.metaValor}>{tituloSaidaMeuRole(item)}</p>
          </div>
          <div>
            <span className={styles.metaRotulo}>Ritmo</span>
            <p className={`${styles.metaValor} ${styles[`ritmo_${item.ritmo}`]}`}>
              {LABELS_RITMO[item.ritmo]}
            </p>
          </div>
        </div>
        <div className={styles.heroLider}>
          {item.criador.fotoUrl ? (
            <img src={item.criador.fotoUrl} alt="" className={styles.liderFoto} />
          ) : (
            <span className={styles.liderIniciais}>{item.criador.apelido.slice(0, 2)}</span>
          )}
          <div>
            <p className={styles.liderNome}>{item.criador.nome || item.criador.apelido}</p>
            <p className={styles.liderMeta}>@{item.criador.apelido} · Líder do Comboio</p>
          </div>
        </div>
        <div className={styles.cardAcoes}>
          <Link href={destino} className={styles.ctaHero}>
            Acessar
          </Link>
          <BotaoCompartilharRole dados={dadosConviteDe(item)} />
        </div>
        {item.papel === "participante" ? (
          <button
            type="button"
            className={styles.linkDesistir}
            onClick={onDesistir}
            disabled={processando}
          >
            Desistir da vaga
          </button>
        ) : null}
        {lider && saidaFutura(item.dataHoraSaida) ? (
          <AcoesOrganizadorRole
            roleId={item.roleId}
            titulo={item.titulo}
            cancelando={processando}
            onCancelar={onCancelarRole}
          />
        ) : null}
      </div>
    </article>
  );
};
