import Link from "next/link";
import type { MeuEventoGaragemItem } from "@/types/meus-roles";
import { BlocoCtaAvaliar } from "./BlocoCtaAvaliar";
import { BlocoPreviewAvaliacao } from "./BlocoPreviewAvaliacao";
import { BotaoRemoverDaLista } from "./BotaoRemoverDaLista";
import {
  formatarAvaliadoRelativo,
  formatarDataEventoCapa,
} from "../formatar-meus-roles";
import { hrefAlbumEvento, hrefAvaliarEvento, hrefDetalheEvento } from "../constants";
import type { AlvoArquivoGaragem } from "../hooks/useArquivoGaragem";
import styles from "../meus-roles.module.css";

type Props = {
  item: MeuEventoGaragemItem;
  ocupadoRemover?: boolean;
  onRemover?: (alvo: AlvoArquivoGaragem) => void;
};

export const CardMeuEvento = ({ item, ocupadoRemover, onRemover }: Props) => {
  const enderecoCurto =
    item.localNome.trim() ||
    item.localEndereco.split(",")[0]?.trim() ||
    item.localEndereco;
  const meta = `${enderecoCurto} · ${item.inscritosTotal} ${
    item.inscritosTotal === 1 ? "piloto" : "pilotos"
  }`;
  const badgeConfirmado = item.status === "confirmado" || item.avaliado;
  const badgeLabel =
    item.status === "cancelado"
      ? "Cancelado"
      : badgeConfirmado
        ? "Presença confirmada"
        : "Concluído";
  const badgeClass =
    item.status === "cancelado"
      ? styles.badgeStatusCancelado
      : badgeConfirmado
        ? styles.badgeStatusTertiary
        : styles.badgeStatusSecondary;
  const temAlbum = item.temAlbum === true;
  const mostrarVerEvento = item.status === "confirmado" || item.status === "cancelado";

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
        {temAlbum ? <span className={styles.seloFotosEvento}>Fotos</span> : null}
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

      {mostrarVerEvento || temAlbum ? (
        <div className={styles.acoesEventoGaragem}>
          {mostrarVerEvento ? (
            <Link href={hrefDetalheEvento(item.eventoId)} className={styles.linkVerEvento}>
              Ver evento
              <span className="material-symbols-outlined" aria-hidden>
                arrow_forward
              </span>
            </Link>
          ) : null}
          {temAlbum ? (
            <Link href={hrefAlbumEvento(item.eventoId)} className={styles.linkFotosEvento}>
              <span className="material-symbols-outlined" aria-hidden>
                photo_library
              </span>
              Ver fotos
            </Link>
          ) : null}
        </div>
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

      {onRemover &&
      (item.status === "concluido" || item.status === "cancelado") ? (
        <div className={styles.cardAcoesArquivo}>
          <BotaoRemoverDaLista
            alvo={{ tipo: "evento", id: item.eventoId, titulo: item.titulo }}
            ocupado={Boolean(ocupadoRemover)}
            onRemover={onRemover}
          />
        </div>
      ) : null}
    </article>
  );
};
