import Link from "next/link";
import type { MeuLocalGaragemItem } from "@/types/meus-roles";
import { LABELS_CATEGORIA_LOCAL } from "@/app/(app)/feed/constants";
import { BlocoCtaAvaliar } from "./BlocoCtaAvaliar";
import { BlocoPreviewAvaliacao } from "./BlocoPreviewAvaliacao";
import { formatarAvaliadoRelativo } from "../formatar-meus-roles";
import { hrefAvaliarLocal, hrefDetalheLocal } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  item: MeuLocalGaragemItem;
};

export const CardMeuLocal = ({ item }: Props) => {
  const categoria =
    LABELS_CATEGORIA_LOCAL[item.categoria] ?? item.categoria;

  return (
    <article className={styles.cardGaragem}>
      <div className={styles.cardLocalGaragemTopo}>
        <Link
          href={hrefDetalheLocal(item.localId)}
          className={styles.cardLocalGaragemThumb}
          aria-label={`Ver ${item.nome}`}
        >
          {item.fotoFachadaUrl ? (
            <img src={item.fotoFachadaUrl} alt="" />
          ) : (
            <span className="material-symbols-outlined" aria-hidden>
              local_gas_station
            </span>
          )}
        </Link>
        <div className={styles.cardLocalGaragemInfo}>
          <span className={styles.badgeCategoriaLocal}>{categoria}</span>
          <h3 className={styles.cardLocalGaragemNome}>
            <Link href={hrefDetalheLocal(item.localId)} className={styles.linkNomeLocal}>
              {item.nome}
            </Link>
          </h3>
          <p className={styles.cardLocalGaragemMeta}>
            {item.facilidadesResumo || item.endereco}
          </p>
        </div>
      </div>

      <Link href={hrefDetalheLocal(item.localId)} className={styles.linkVerEvento}>
        Ver local
        <span className="material-symbols-outlined" aria-hidden>
          arrow_forward
        </span>
      </Link>

      {!item.avaliado ? (
        <BlocoCtaAvaliar
          href={hrefAvaliarLocal(item.localId)}
          titulo="Deixar feedback do ponto"
          labelCta="Avaliar"
        />
      ) : null}

      {item.avaliado && item.minhaAvaliacao ? (
        <BlocoPreviewAvaliacao
          nota={item.minhaAvaliacao.nota}
          comentario={item.minhaAvaliacao.comentario}
          quando={formatarAvaliadoRelativo(item.minhaAvaliacao.createdAt)}
          hrefVerRelato={hrefAvaliarLocal(item.localId)}
          fotosCount={item.minhaAvaliacao.fotosCount}
        />
      ) : null}
    </article>
  );
};
