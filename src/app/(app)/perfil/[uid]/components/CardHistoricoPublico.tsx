import Link from "next/link";
import type { ItemHistoricoEvento, ItemHistoricoRole } from "@/types/historico-pistas";
import type { ItemHistoricoTelemetria } from "@/types/role-telemetria";
import { ThumbMapaArquivo } from "@/components/maps/ThumbMapaArquivo";
import { tituloLocal } from "@/lib/localizacao";
import { formatarDistancia, formatarDuracao } from "@/lib/telemetria/formatar-telemetria";
import { formatarDataMeta } from "../../formatar-data-historico";
import {
  hrefCardHistoricoPublicoEvento,
  hrefCardHistoricoPublicoRole,
  PAPEL_CARD,
  STATUS_CARD_PUBLICO,
} from "../constants";
import styles from "../perfil-publico.module.css";

type PropsRole = {
  item: ItemHistoricoRole;
};

export const CardHistoricoPublicoRole = ({ item }: PropsRole) => {
  const eLider = item.status === "lider";
  const statusLabel = STATUS_CARD_PUBLICO[item.status];
  const papel = eLider ? PAPEL_CARD.lider : PAPEL_CARD.participante;
  const saida = tituloLocal({
    nome: item.localSaidaNome ?? "",
    endereco: item.localSaidaEndereco ?? "",
  });
  const chegada = tituloLocal({
    nome: item.destinoFinalNome ?? "",
    endereco: item.destinoFinalEndereco ?? "",
  });
  const foto = (item.fotoCapaUrl ?? "").trim();

  return (
    <Link
      href={hrefCardHistoricoPublicoRole(item)}
      className={styles.cardHistorico}
      aria-label={`Ver detalhes de ${item.titulo}`}
    >
      <div className={styles.cardHistoricoTopo}>
        <div className={styles.cardHistoricoArquivo}>
          <span className={styles.cardHistoricoThumb}>
            {foto ? (
              <img src={foto} alt="" />
            ) : (
              <span className="material-symbols-outlined" aria-hidden>
                two_wheeler
              </span>
            )}
          </span>
          <div className={styles.cardHistoricoInfo}>
            <div className={styles.cardHistoricoTitulo}>{item.titulo}</div>
            <div className={styles.cardHistoricoData}>
              {formatarDataMeta(item.dataHoraSaida)}
            </div>
            {saida || chegada ? (
              <p className={styles.cardHistoricoRota}>
                <span>{saida}</span>
                <span aria-hidden> → </span>
                <span>{chegada}</span>
              </p>
            ) : null}
          </div>
        </div>
        {statusLabel ? (
          <span
            className={`${styles.badgeStatus} ${eLider ? styles.badgeStatusLider : ""}`}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>
      <div className={styles.cardHistoricoMeta}>
        <span className={styles.metaItem}>
          <span className="material-symbols-outlined" aria-hidden>
            straighten
          </span>
          {item.distanciaKm} km
        </span>
        {eLider ? (
          <span className={styles.metaItem}>
            <span className="material-symbols-outlined" aria-hidden>
              two_wheeler
            </span>
            {item.participantesConfirmados} Motos
          </span>
        ) : null}
        <span
          className={`${styles.metaPapel} ${eLider ? styles.metaPapelLider : ""}`}
        >
          <span className="material-symbols-outlined" aria-hidden>
            {eLider ? "star" : "group"}
          </span>
          {papel}
        </span>
      </div>
    </Link>
  );
};

type PropsEvento = {
  item: ItemHistoricoEvento;
};

export const CardHistoricoPublicoEvento = ({ item }: PropsEvento) => {
  const statusLabel = STATUS_CARD_PUBLICO[item.status];

  return (
    <Link
      href={hrefCardHistoricoPublicoEvento(item)}
      className={styles.cardHistorico}
      aria-label={`Abrir evento ${item.titulo}`}
    >
      <div className={styles.cardHistoricoTopo}>
        <div>
          <div className={styles.cardHistoricoTitulo}>{item.titulo}</div>
          <div className={styles.cardHistoricoData}>
            {formatarDataMeta(item.dataHoraAbertura)}
          </div>
        </div>
        {statusLabel ? (
          <span className={styles.badgeStatus}>{statusLabel}</span>
        ) : null}
      </div>
      <div className={styles.cardHistoricoMeta}>
        <span className={styles.badgeTipoEvento}>
          <span className="material-symbols-outlined" aria-hidden>
            local_activity
          </span>
          Evento
        </span>
        <span className={styles.metaItem}>
          <span className="material-symbols-outlined" aria-hidden>
            location_on
          </span>
          {item.localNome}
        </span>
        <span className={styles.metaItem}>
          <span className="material-symbols-outlined" aria-hidden>
            group
          </span>
          {item.inscritosConfirmados} inscritos
        </span>
      </div>
    </Link>
  );
};

type PropsTelemetria = {
  item: ItemHistoricoTelemetria;
};

export const CardHistoricoPublicoTelemetria = ({ item }: PropsTelemetria) => {
  const saida = tituloLocal(
    item.pontoInicio ?? { nome: "", endereco: "" },
  );
  const chegada = tituloLocal(
    item.pontoFim ?? { nome: "", endereco: "" },
  );

  return (
    <Link
      href={`/telemetria/${item.id}`}
      className={styles.cardHistorico}
      aria-label={`Abrir telemetria ${item.titulo}`}
    >
      <div className={styles.cardHistoricoTopo}>
        <div className={styles.cardHistoricoArquivo}>
          <ThumbMapaArquivo
            fotoUrl={item.fotoUrl}
            pontoA={item.pontoInicio}
            pontoB={item.pontoFim}
            iconeFallback="speed"
            ariaLabel={`Mapa de ${item.titulo}`}
            className={styles.cardHistoricoThumbMapa}
          />
          <div className={styles.cardHistoricoInfo}>
            <div className={styles.cardHistoricoTitulo}>{item.titulo}</div>
            <div className={styles.cardHistoricoData}>
              {formatarDataMeta(item.encerradoEm)}
            </div>
            {saida || chegada ? (
              <p className={styles.cardHistoricoRota}>
                <span>{saida}</span>
                <span aria-hidden> → </span>
                <span>{chegada}</span>
              </p>
            ) : null}
          </div>
        </div>
        <span className={styles.badgeStatus}>GPS</span>
      </div>
      <div className={styles.cardHistoricoMeta}>
        <span className={styles.metaItem}>
          <span className="material-symbols-outlined" aria-hidden>
            straighten
          </span>
          {formatarDistancia(item.distanciaKm)}
        </span>
        <span className={styles.metaItem}>
          <span className="material-symbols-outlined" aria-hidden>
            schedule
          </span>
          {formatarDuracao(item.tempoSegundos)}
        </span>
      </div>
    </Link>
  );
};
