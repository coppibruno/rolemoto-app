import Link from "next/link";
import type { MeuEventoGaragemItem } from "@/types/meus-roles";
import { BlocoCtaAvaliar } from "./BlocoCtaAvaliar";
import { BlocoPreviewAvaliacao } from "./BlocoPreviewAvaliacao";
import {
  formatarAvaliadoRelativo,
  formatarDataEventoCapa,
} from "../formatar-meus-roles";
import { hrefAvaliarEvento, hrefDetalheEvento } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  item: MeuEventoGaragemItem;
};

export const CardMeuEvento = ({ item }: Props) => {
  const enderecoCurto =
    item.localNome.trim() ||
    item.localEndereco.split(",")[0]?.trim() ||
    item.localEndereco;
  const meta = `${enderecoCurto} · ${item.inscritosTotal} ${
    item.inscritosTotal === 1 ? "piloto" : "pilotos"
  }`;
  const badgeConfirmado = item.status === "confirmado" || item.avaliado;
  const badgeLabel = badgeConfirmado ? "Presença confirmada" : "Concluído";
  const badgeClass = badgeConfirmado
    ? styles.badgeStatusTertiary
    : styles.badgeStatusSecondary;

  return (
    <article className={styles.cardGaragem}>
      <div className={styles.cardEventoCapa}>
        {item.fotoCapaUrl ? (
          <img src={item.fotoCapaUrl} alt="" className={styles.cardEventoImg} />
        ) : (
          <div className={styles.cardEventoPlaceholder} aria-hidden>
            <span className="material-symbols-outlined">local_activity</span>
          </div>
        )}
        <div className={styles.cardEventoGradiente} />
        <span className={styles.cardEventoData}>
          {formatarDataEventoCapa(item.dataHoraAbertura)}
        </span>
        <span className={badgeClass}>{badgeLabel}</span>
        <div className={styles.cardEventoTexto}>
          <h3 className={styles.cardEventoTitulo}>{item.titulo}</h3>
          <p className={styles.cardEventoMeta}>
            <span className="material-symbols-outlined" aria-hidden>
              pin_drop
            </span>
            {meta}
          </p>
        </div>
      </div>

      {item.status === "confirmado" ? (
        <Link href={hrefDetalheEvento(item.eventoId)} className={styles.linkVerEvento}>
          Ver evento
          <span className="material-symbols-outlined" aria-hidden>
            arrow_forward
          </span>
        </Link>
      ) : null}

      {item.status === "concluido" && !item.avaliado ? (
        <BlocoCtaAvaliar
          href={hrefAvaliarEvento(item.eventoId)}
          titulo="Avaliação pendente"
          descricao="Como foi a organização, segurança e o ponto deste encontro?"
          labelCta="Avaliar evento agora"
        />
      ) : null}

      {item.avaliado && item.minhaAvaliacao ? (
        <BlocoPreviewAvaliacao
          nota={item.minhaAvaliacao.nota}
          comentario={item.minhaAvaliacao.comentario}
          quando={formatarAvaliadoRelativo(item.minhaAvaliacao.createdAt)}
          hrefVerRelato={hrefAvaliarEvento(item.eventoId)}
        />
      ) : null}
    </article>
  );
};
