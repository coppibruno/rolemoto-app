import Link from "next/link";
import type { MeuRoleItem } from "@/types/meus-roles";
import { BotaoCompartilharRole } from "@/app/(app)/feed/components/BotaoCompartilharRole";
import { hrefClonarRole, hrefMeuRole } from "../constants";
import {
  dadosConviteDe,
  formatarDataConcluido,
  formatarKm,
  tituloDestinoMeuRole,
  tituloSaidaMeuRole,
} from "../formatar-meus-roles";
import type { AlvoArquivoGaragem } from "../hooks/useArquivoGaragem";
import { BotaoFixarGaragem } from "./BotaoFixarGaragem";
import { BotaoRemoverDaLista } from "./BotaoRemoverDaLista";
import styles from "../meus-roles.module.css";

type Props = {
  item: MeuRoleItem;
  ocupadoRemover?: boolean;
  onRemover?: (alvo: AlvoArquivoGaragem) => void;
};

export const CardConcluidoRole = ({ item, ocupadoRemover, onRemover }: Props) => {
  const destino = hrefMeuRole(item);
  const organizador = item.papel === "organizador";
  const saida = tituloSaidaMeuRole(item);
  const chegada = tituloDestinoMeuRole(item);

  return (
    <article className={styles.card}>
      <div className={styles.cardTopo}>
        <span className={styles.pillConcluido}>
          <span className="material-symbols-outlined">check_circle</span>
          Concluído
        </span>
        <span className={styles.cardData}>{formatarDataConcluido(item.dataHoraSaida)}</span>
      </div>

      <div className={styles.cardArquivoTopo}>
        <Link
          href={destino}
          className={styles.cardArquivoThumb}
          aria-label={`Abrir ${item.titulo}`}
        >
          {item.fotoCapaUrl ? (
            <img src={item.fotoCapaUrl} alt="" />
          ) : (
            <span className="material-symbols-outlined" aria-hidden>
              two_wheeler
            </span>
          )}
        </Link>
        <div className={styles.cardArquivoInfo}>
          <Link href={destino} className={styles.cardTituloLink}>
            <h2 className={styles.cardTitulo}>{item.titulo}</h2>
            <p className={styles.cardMeta}>{formatarKm(item.distanciaRotaKm)} rodados</p>
          </Link>
          <p className={styles.cardArquivoRota}>
            <span className={styles.cardArquivoPonto}>
              <span className="material-symbols-outlined" aria-hidden>
                trip_origin
              </span>
              {saida}
            </span>
            <span className={styles.cardArquivoSeta} aria-hidden>
              →
            </span>
            <span className={styles.cardArquivoPonto}>
              <span className="material-symbols-outlined" aria-hidden>
                flag
              </span>
              {chegada}
            </span>
          </p>
        </div>
      </div>

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
        {organizador ? (
          <BotaoFixarGaragem
            roleId={item.roleId}
            titulo={item.titulo}
            fixado={item.fixado}
          />
        ) : null}
        <BotaoCompartilharRole dados={dadosConviteDe(item)} />
      </div>
      {onRemover ? (
        <div className={styles.cardAcoesArquivo}>
          <BotaoRemoverDaLista
            alvo={{ tipo: "role", id: item.roleId, titulo: item.titulo }}
            ocupado={Boolean(ocupadoRemover)}
            onRemover={onRemover}
          />
        </div>
      ) : null}
    </article>
  );
};
